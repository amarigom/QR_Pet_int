import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenException, ResourceNotFoundException
from app.models.user import User
from app.repositories.pet_repository import PetRepository
from app.repositories.pet_vector_repository import PetVectorRepository
from app.repositories.qr_repository import QRRepository
from app.schemas.composite import PetDetailResponse
from app.schemas.pet import PetCreate, PetResponse, PetUpdate


class PetService:
    """Service para gestionar el ciclo de vida de las mascotas, sus estadísticas y su representación vectorial."""

    def __init__(
        self, 
        db: AsyncSession, 
        vector_repo: Optional[PetVectorRepository] = None
    ):
        self.db = db
        self.pet_repo = PetRepository(db)
        self.qr_repo = QRRepository(db)
        # Si no se inyecta un vector_repo, se instancia por defecto
        self.vector_repo = vector_repo or PetVectorRepository()

    # ------------------------------------------------------------------
    # Métodos privados de formateo para ChromaDB
    # ------------------------------------------------------------------

    def _build_semantic_text(self, pet: Any) -> str:
        """Helper privado para transformar la entidad SQLAlchemy en un texto narrativo rico para embeddings."""
        nombre = getattr(pet, "nombre", "Mascota")
        especie = getattr(pet, "especie", "")
        raza = getattr(pet, "raza", "mestizo") or "mestizo"
        color = getattr(pet, "color", "") or "no especificado"
        tamano = getattr(pet, "tamano", "") or "mediano"
        ciudad = getattr(pet, "ciudad", "") or "no especificada"
        estado = getattr(pet, "estado", "") or "en adopcion"
        notas = getattr(pet, "descripcion", None) or getattr(pet, "notas", None) or "Sin detalles adicionales"

        return (
            f"Mascota de nombre {nombre}. Es un {especie} de raza {raza}, "
            f"pelaje o aspecto {color} y tamaño {tamano}. "
            f"Ubicación: {ciudad}. Estado actual: {estado}. "
            f"Detalles: {notas}"
        )

    def _build_metadata(self, pet: Any) -> Dict[str, Any]:
        """Helper privado para extraer metadatos con tipos primitivos (str, int, float, bool)."""
        return {
            "especie": str(getattr(pet, "especie", "")).lower(),
            "ciudad": str(getattr(pet, "ciudad", "")),
            "estado": str(getattr(pet, "estado", "")).lower(),
            "vacunado": bool(getattr(pet, "vacunado", False)),
        }

    # ------------------------------------------------------------------
    # Operaciones CRUD e Integración Vectorial
    # ------------------------------------------------------------------

    async def get_user_stats(self, user_id: uuid.UUID) -> Dict[str, int]:
        """Obtiene las estadísticas del dashboard delegando en el repositorio."""
        total_pets = await self.pet_repo.count_user_pets(user_id)
        active_qrs = await self.pet_repo.count_user_active_qrs(user_id)
        total_scans = await self.pet_repo.count_user_scans(user_id)

        return {
            "pets_count": total_pets,
            "qrs_count": active_qrs,
            "scans_count": total_scans,
            "recent_scans": [],
        }

    async def create_pet(self, user_id: uuid.UUID, pet_data: PetCreate) -> PetDetailResponse:
        """Crea una mascota vinculada al usuario e indexa su embedding en la base vectorial."""
        new_pet = await self.pet_repo.create(
            usuario_id=user_id,
            **pet_data.model_dump()
        )
        await self.db.commit()

        # Recargamos con relaciones para el esquema Detail
        pet_full = await self.pet_repo.get_by_id(new_pet.id)
        if not pet_full:
            raise ResourceNotFoundException("Mascota recién creada")

        # Indexar en ChromaDB a través del repositorio vectorial
        description = self._build_semantic_text(pet_full)
        metadata = self._build_metadata(pet_full)
        self.vector_repo.index_pet(
            pet_id=str(pet_full.id),
            description=description,
            metadata=metadata
        )

        return PetDetailResponse.model_validate(pet_full)

    async def get_pet(self, current_user: User, pet_id: uuid.UUID) -> PetDetailResponse:
        """Obtiene detalles de una mascota validando propiedad o rol de admin."""
        pet = await self.pet_repo.get_by_id(pet_id)

        if not pet:
            raise ResourceNotFoundException("Mascota")

        es_dueno = pet.usuario_id == current_user.id
        es_admin = current_user.rol == "admin"

        if not (es_dueno or es_admin):
            raise ForbiddenException("No tienes permiso para acceder a esta mascota")

        return PetDetailResponse.model_validate(pet)

    async def get_user_pets(self, user_id: uuid.UUID, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Listado paginado de mascotas del usuario."""
        offset = (page - 1) * limit

        pets = await self.pet_repo.get_by_user(user_id, limit, offset)
        total = await self.pet_repo.count_user_pets(user_id)

        return {
            "items": [PetResponse.model_validate(p) for p in pets],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }

    async def update_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID, pet_data: PetUpdate) -> PetDetailResponse:
        """Actualiza datos de la mascota en SQL y re-indexa sus cambios en la base vectorial."""
        pet = await self.pet_repo.get_by_id(pet_id)

        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")

        update_dict = pet_data.model_dump(exclude_unset=True)
        if update_dict:
            await self.pet_repo.update(pet, update_dict)

        await self.db.commit()
        await self.db.refresh(pet)

        # Actualizar / Sobreescribir embedding en ChromaDB
        description = self._build_semantic_text(pet)
        metadata = self._build_metadata(pet)
        self.vector_repo.index_pet(
            pet_id=str(pet.id),
            description=description,
            metadata=metadata
        )

        return PetDetailResponse.model_validate(pet)

    async def delete_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID) -> bool:
        """Elimina una mascota de SQL y de la base vectorial validando propiedad."""
        pet = await self.pet_repo.get_by_id(pet_id)

        # Corrección: Se estandarizó el campo a pet.usuario_id
        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")

        success = await self.pet_repo.delete(pet_id)
        await self.db.commit()

        if success:
            # Eliminar vector en ChromaDB
            self.vector_repo.delete_pet(pet_id=str(pet_id))

        return success

    async def search_similar_pets(
        self, 
        query: str, 
        limit: int = 5, 
        where_filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Delegación de búsqueda semántica hacia el repositorio vectorial."""
        return self.vector_repo.search_similar(
            query=query, 
            limit=limit, 
            where_filter=where_filter
        )