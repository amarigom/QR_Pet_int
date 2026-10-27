from app.models.user import User
from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    ResourceNotFoundException,
)
from app.core.constants import UserRole
import uuid
import asyncio
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from sqlalchemy import text

from app.repositories.pet_repository import PetRepository
from app.repositories.qr_repository import QRRepository
from app.models.qr import QRCode
from app.core.exceptions import ResourceNotFoundException
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.schemas.composite import PetDetailResponse
from app.schemas.user import UserDashboardStats

from app.services.pgvector_service import VectorStoreService

logger = logging.getLogger(__name__)


class PetService:
    """Service para gestionar el ciclo de vida de las mascotas y sus estadísticas"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.pet_repo = PetRepository(db)
        self.qr_repo = QRRepository(db)

    @staticmethod
    def _require_pet_owner_role(user: User) -> None:
        if user.rol != UserRole.USER:
            raise ForbiddenException("Solo el dueño de la mascota puede vincular una veterinaria.")

    async def search_veterinarians(
        self, current_user: User, search: str
    ) -> list[dict]:
        self._require_pet_owner_role(current_user)
        return await self.pet_repo.search_active_veterinarians(search)

    async def get_pet_veterinarians(
        self, current_user: User, pet_id: uuid.UUID
    ) -> list[dict]:
        pet = await self.pet_repo.get_by_id(pet_id)
        if pet is None or pet.usuario_id != current_user.id:
            raise ResourceNotFoundException("Mascota")
        return await self.pet_repo.get_veterinarians_for_pet(pet_id)

    async def link_veterinarian(
        self,
        current_user: User,
        pet_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
    ) -> list[dict]:
        self._require_pet_owner_role(current_user)
        pet = await self.pet_repo.get_by_id(pet_id)
        if pet is None or pet.usuario_id != current_user.id:
            raise ResourceNotFoundException("Mascota")
        clinic = await self.pet_repo.get_active_veterinarian(veterinarian_id)
        if clinic is None:
            raise ResourceNotFoundException(
                "Veterinaria",
                detail="No se encontró una veterinaria activa con ese identificador.",
            )
        await self.pet_repo.link_veterinarian_to_pet(pet_id, veterinarian_id)
        linked_clinics = await self.pet_repo.get_veterinarians_for_pet(pet_id)
        if not linked_clinics or linked_clinics[0]["veterinario_id"] != veterinarian_id:
            raise ConflictException(
                "Esta mascota ya está vinculada a otra veterinaria. "
                "Desvinculala antes de elegir una distinta."
            )
        return linked_clinics

    async def unlink_veterinarian(
        self,
        current_user: User,
        pet_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
    ) -> None:
        self._require_pet_owner_role(current_user)
        pet = await self.pet_repo.get_by_id(pet_id)
        if pet is None or pet.usuario_id != current_user.id:
            raise ResourceNotFoundException("Mascota")
        if not await self.pet_repo.unlink_veterinarian_from_pet(
            pet_id, veterinarian_id
        ):
            raise ResourceNotFoundException(
                "Vínculo veterinario",
                detail="La mascota no está vinculada a esa veterinaria.",
            )

    async def replace_pet_qr(
        self,
        current_user: User,
        pet_id: uuid.UUID,
        new_code: str,
    ) -> QRCode:
        pet = await self.pet_repo.get_by_id_for_update(pet_id)
        if pet is None or pet.usuario_id != current_user.id:
            raise ResourceNotFoundException("Mascota")

        qr = await self.qr_repo.get_by_code_for_update(new_code.strip())
        if qr is None:
            raise ResourceNotFoundException(
                "Código QR",
                detail="No se encontró una medalla con ese código.",
            )
        if not qr.activo:
            raise ConflictException("La medalla nueva está inactiva.")
        if qr.mascota_id is not None:
            raise ConflictException(
                "La medalla ya está vinculada a una mascota."
            )

        current_qrs = await self.qr_repo.get_active_by_pet_for_update(pet_id)
        for current_qr in current_qrs:
            current_qr.activo = False

        qr.mascota_id = pet_id
        try:
            await self.db.commit()
            await self.db.refresh(qr)
        except Exception:
            await self.db.rollback()
            raise
        return qr

    
    
    def _build_semantic_text(self, pet: Any) -> str:
        """Construye el texto enriquecido para generar el embedding (SÍNCRONO)."""
        nombre = getattr(pet, "nombre", "") or ""
        especie = getattr(pet, "especie", "") or ""
        raza = getattr(pet, "raza", "") or ""
        nota = (
            getattr(
                pet,
                "notas",
                getattr(pet, "notes", getattr(pet, "descripcion", "")),
            )
            or ""
        )

        return f"Nombre: {nombre}. Especie: {especie}. Raza: {raza}. Detalles: {nota}".strip()

    def _build_metadata(self, pet: Any) -> Dict[str, Any]:
        """Extrae la metadata estructurada (SÍNCRONO)."""
        return {
            "especie": str(getattr(pet, "especie", "") or "").lower(),
            "raza": str(getattr(pet, "raza", "") or "").lower(),
            "color": str(getattr(pet, "color", "") or "").lower(),
            "estado": str(getattr(pet, "estado", "") or "").lower(),
        }

    async def reindex_pet(self, pet: Any) -> bool:
        """Indexa una sola mascota en pgvector."""
        texto_completo = self._build_semantic_text(pet)
        metadata = self._build_metadata(pet)

        return await self.vector_service.add_pet(
            pet_id=str(pet.id),
            description=texto_completo,
            metadata=metadata,
        )

    async def sincronizar_vectores(self, db: AsyncSession, batch_size: int = 50) -> Dict[str, Any]:
        """Sincroniza masivamente la tabla de vectores sin riesgo de expiración del ORM."""
        # 1. Truncar o preparar la tabla de vectores
        try:
            await db.execute(text("TRUNCATE TABLE pet_vectors RESTART IDENTITY CASCADE;"))
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(f"No se pudo truncar pet_vectors: {e}")

        total_mascotas = await self.pet_repo.count_all()
        if total_mascotas == 0:
            return {"message": "No hay mascotas para sincronizar", "procesados": 0}

        registros_procesados = 0

        for offset in range(0, total_mascotas, batch_size):
            mascotas_batch = await self.pet_repo.get_paginated(offset=offset, limit=batch_size)

            # 2. DESACOPLE: Convertir los objetos ORM a dicts primitivos ANTES de procesar
            batch_primitivo = []
            for pet in mascotas_batch:
                batch_primitivo.append({
                    "id": str(pet.id),
                    "nombre": pet.nombre or "",
                    "especie": pet.especie or "",
                    "raza": pet.raza or "",
                    "notas": getattr(pet, "notas", getattr(pet, "notes", getattr(pet, "descripcion", ""))) or "",
                })

            # 3. Procesar embeddings e inserciones iterando sobre los dicts
            for item in batch_primitivo:
                try:
                    # Construir el texto a partir del diccionario primitivo
                    texto_completo = f"Nombre: {item['nombre']}. Especie: {item['especie']}. Raza: {item['raza']}. Detalles: {item['notas']}".strip()
                    
                    # Metadata simple
                    metadata_dict = {
                        "especie": item["especie"],
                        "raza": item["raza"]
                    }

                    # Ingestar el vector
                    exito = await self.vector_service.add_pet(
                        pet_id=item["id"],
                        description=texto_completo,
                        metadata=metadata_dict,
                    )

                    if exito:
                        registros_procesados += 1

                except Exception as err:
                    logger.error(f"Error reindexando mascota ID {item['id']}: {err}")

        return {
            "status": "success",
            "message": f"Se sincronizaron correctamente {registros_procesados} mascotas en pgvector.",
            "total_mascotas": total_mascotas,
        }
    

    async def create_pet(self, user_id: uuid.UUID, pet_data: PetCreate) -> PetDetailResponse:
        """Crea una mascota vinculada al usuario actual"""
        new_pet = await self.pet_repo.create(
            usuario_id=user_id,
            **pet_data.model_dump()
        )
        await self.db.commit()
        
        # Recargamos con relaciones (owner, qr_code) para el esquema Detail
        pet_full = await self.pet_repo.get_by_id(new_pet.id)
        if not pet_full:
            raise ResourceNotFoundException("Mascota recién creada")
        
        return PetDetailResponse.model_validate(pet_full)
    
    async def get_pet(self, current_user: User, pet_id: uuid.UUID) -> PetDetailResponse:
        """Obtiene detalles de una mascota validando propiedad o rol de admin"""
        pet = await self.pet_repo.get_by_id(pet_id)
        
        if not pet:
            raise ResourceNotFoundException("Mascota")
        
        es_dueno = pet.usuario_id == current_user.id
        es_admin = current_user.rol == "admin"

        if not (es_dueno or es_admin):
            # Si no es ninguna de las dos, lanzamos error de permisos
            # Usamos Forbidden (403) en lugar de Not Found para que el QA sepa que existe pero no tiene permiso
            raise ForbiddenException("No tienes permiso para acceder a esta mascota")
        
        return PetDetailResponse.model_validate(pet)
    
    
    async def get_user_pets(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
    ) -> Dict[str, Any]:
        """Listado paginado de mascotas del usuario con ejecución secuencial segura"""
        offset = (page - 1) * limit
    
    # 1. Primero buscamos los datos de las mascotas
        pets = await self.pet_repo.get_by_user(user_id, limit, offset, search)
    
    # 2. Luego contamos el total (una vez que la sesión anterior se liberó)
        total = await self.pet_repo.count_user_pets(user_id, search)
    
        return {
            "items": [PetResponse.model_validate(p) for p in pets],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }

    async def get_user_stats(self, user_id: uuid.UUID) -> UserDashboardStats:
        """Obtiene las estadísticas básicas del usuario autenticado."""
        return UserDashboardStats(
            pets_count=await self.pet_repo.count_user_pets(user_id),
            qrs_count=await self.pet_repo.count_user_active_qrs(user_id),
            scans_count=await self.pet_repo.count_user_scans(user_id),
            recent_scans=[],
        )
    
        
    
    async def update_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID, pet_data: PetUpdate) -> PetDetailResponse:
        """Actualiza datos de la mascota validando propiedad"""
        pet = await self.pet_repo.get_by_id(pet_id)
    
        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")
    
        update_dict = pet_data.model_dump(exclude_unset=True)
        if update_dict:
                await self.pet_repo.update(pet, update_dict)
        
        await self.db.commit()
        await self.db.refresh(pet)
    
        return PetDetailResponse.model_validate(pet)
    
    async def delete_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID) -> bool:
        """Elimina una mascota validando propiedad"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")
        
        success = await self.pet_repo.delete(pet_id)
        await self.db.commit()
        return success