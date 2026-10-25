from typing import Optional, List
import uuid
from sqlalchemy import delete, select, func, or_
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from app.repositories.base import BaseRepository
from app.models.pet import Pet
from app.models.qr import QRCode
from app.models.scan import Scan
from app.core.constants import UserRole
from app.models.user import User
from app.models.veterinario import PerfilVeterinario
from app.models.veterinario_mascota import veterinario_mascotas

class PetRepository(BaseRepository[Pet]):
    """Repository especializado en Mascotas con soporte para estadísticas"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=Pet, session=session)

    # --- MÉTODOS DE BÚSQUEDA ---

    async def get_by_id(self, pet_id: uuid.UUID) -> Optional[Pet]:
        """Carga relaciones necesarias para evitar errores de Lazy Loading."""
        query = (
            select(Pet)
            .where(Pet.id == pet_id)
            .options(
                selectinload(Pet.owner),
                selectinload(Pet.qr_code)
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, pet_id: uuid.UUID) -> Optional[Pet]:
        result = await self.session.execute(
            select(Pet).where(Pet.id == pet_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def search_active_veterinarians(self, search: str) -> list[dict]:
        term = f"%{search.strip()}%"
        query = (
            select(
                PerfilVeterinario.user_id.label("veterinario_id"),
                PerfilVeterinario.nombre_clinica,
                PerfilVeterinario.matricula,
                PerfilVeterinario.logo_url,
            )
            .join(User, User.id == PerfilVeterinario.user_id)
            .where(
                PerfilVeterinario.activo.is_(True),
                User.rol == UserRole.VETERINARIO,
                or_(
                    PerfilVeterinario.nombre_clinica.ilike(term),
                    PerfilVeterinario.matricula.ilike(term),
                ),
            )
            .order_by(PerfilVeterinario.nombre_clinica.asc())
            .limit(20)
        )
        result = await self.session.execute(query)
        return [dict(row._mapping) for row in result.all()]

    async def get_active_veterinarian(self, veterinarian_id: uuid.UUID):
        query = (
            select(PerfilVeterinario)
            .join(User, User.id == PerfilVeterinario.user_id)
            .where(
                PerfilVeterinario.user_id == veterinarian_id,
                PerfilVeterinario.activo.is_(True),
                User.rol == UserRole.VETERINARIO,
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_veterinarians_for_pet(self, pet_id: uuid.UUID) -> list[dict]:
        query = (
            select(
                PerfilVeterinario.user_id.label("veterinario_id"),
                PerfilVeterinario.nombre_clinica,
                PerfilVeterinario.matricula,
                PerfilVeterinario.logo_url,
                veterinario_mascotas.c.created_at,
            )
            .join(
                veterinario_mascotas,
                veterinario_mascotas.c.veterinario_id == PerfilVeterinario.user_id,
            )
            .where(veterinario_mascotas.c.mascota_id == pet_id)
            .order_by(PerfilVeterinario.nombre_clinica.asc())
        )
        result = await self.session.execute(query)
        return [dict(row._mapping) for row in result.all()]

    async def link_veterinarian_to_pet(
        self, pet_id: uuid.UUID, veterinarian_id: uuid.UUID
    ) -> None:
        statement = (
            insert(veterinario_mascotas)
            .values(veterinario_id=veterinarian_id, mascota_id=pet_id)
            .on_conflict_do_nothing(
                index_elements=[veterinario_mascotas.c.mascota_id]
            )
        )
        await self.session.execute(statement)
        await self.session.commit()

    async def unlink_veterinarian_from_pet(
        self, pet_id: uuid.UUID, veterinarian_id: uuid.UUID
    ) -> bool:
        result = await self.session.execute(
            delete(veterinario_mascotas).where(
                veterinario_mascotas.c.mascota_id == pet_id,
                veterinario_mascotas.c.veterinario_id == veterinarian_id,
            )
        )
        await self.session.commit()
        return result.rowcount > 0

    async def get_by_user(
        self,
        owner_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
    ) -> List[Pet]:
        """Obtiene mascotas de un usuario con sus relaciones necesarias para el dashboard."""
        query = (
            select(Pet)
            .where(Pet.usuario_id == owner_id)
            .options(
                selectinload(Pet.owner),
                selectinload(Pet.qr_code),
            )
            .order_by(Pet.created_at.desc())
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = (
                query.outerjoin(QRCode, Pet.id == QRCode.mascota_id)
                .where(
                    or_(
                        Pet.nombre.ilike(term),
                        Pet.especie.ilike(term),
                        Pet.raza.ilike(term),
                        QRCode.codigo.ilike(term),
                    )
                )
                .distinct()
            )
        query = query.limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_qr_code(self, qr_code_str: str) -> Optional[Pet]:
        """Obtiene la mascota asociada a un string de código QR físico."""
        query = (
            select(Pet)
            .join(QRCode, QRCode.mascota_id == Pet.id) 
            .where(QRCode.codigo == qr_code_str)
            .options(selectinload(Pet.owner), selectinload(Pet.codigos_qr)) 
        )
        return (await self.session.execute(query)).scalar_one_or_none()

    # --- MÉTODOS DE CONTEO (Para el Service / Dashboard) ---

    async def count_user_pets(self, owner_id: uuid.UUID, search: str | None = None) -> int:
        """Cuenta eficiente de mascotas por usuario."""
        query = select(func.count(func.distinct(Pet.id))).select_from(Pet).where(
            Pet.usuario_id == owner_id
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = (
                query.outerjoin(QRCode, Pet.id == QRCode.mascota_id)
                .where(
                    or_(
                        Pet.nombre.ilike(term),
                        Pet.especie.ilike(term),
                        Pet.raza.ilike(term),
                        QRCode.codigo.ilike(term),
                    )
                )
            )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_user_active_qrs(self, owner_id: uuid.UUID) -> int:
        """
        Contamos usando LEFT JOIN para que, si el usuario existe pero no tiene mascotas, 
        la consulta sea válida y devuelva 0.
        """
        query = (
            select(func.count(QRCode.id))
            .select_from(Pet)  # Partimos de la mascota
            # Usamos outerjoin (LEFT JOIN) hacia QRCode
            .outerjoin(QRCode, Pet.id == QRCode.mascota_id) 
            .where(
                Pet.usuario_id == owner_id, 
                QRCode.activo == True
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    async def count_user_scans(self, owner_id: uuid.UUID) -> int:
        """Cuenta todos los escaneos de las mascotas del usuario usando Outer Joins."""
        from app.models.scan import Scan
        from app.models.qr import QRCode
        from app.models.pet import Pet

        query = (
            select(func.count(Scan.id))
            .select_from(Pet)  # 1. Empezamos por la mascota del usuario
            .outerjoin(QRCode, Pet.id == QRCode.mascota_id)  # 2. Buscamos sus QRs (si tiene)
            .outerjoin(Scan, QRCode.id == Scan.qr_id)        # 3. Buscamos sus scans (si tiene)
            .where(Pet.usuario_id == owner_id)
        )
    
        result = await self.session.execute(query)
        return result.scalar() or 0

    # --- MÉTODOS DE ADMIN ---

    async def get_all_with_owner(self, limit: int = 100, offset: int = 0) -> List[Pet]:
        """Listado optimizado con joinedload para administración."""
        query = (
            select(Pet)
            .options(joinedload(Pet.owner),joinedload(Pet.qr_code))
            .order_by(Pet.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().unique().all())
    
    async def get_by_id_with_owner(self, pet_id: uuid.UUID) -> Pet | None:
        """
        Obtiene una mascota por su ID incluyendo la relación con su dueño.
        Utiliza joinedload para optimizar la consulta en un solo JOIN.
        """
        query = (
            select(Pet)
            .options(joinedload(Pet.owner),joinedload(Pet.qr_code))
            .where(Pet.id == pet_id)
            .execution_options(populate_existing=True)
        )
        result = await self.session.execute(query)
        # .unique() es importante cuando usas joinedload para evitar filas duplicadas
        return result.scalars().unique().first()
    
# --- MÉTODOS DE MUTACIÓN (Actualización y Eliminación) ---

    async def update(self, db_obj: Pet, update_data: dict) -> Pet:
        """
        Recibe el objeto mascota mapeado por el ORM y un diccionario con los cambios.
        Actualiza los valores en memoria y prepara los cambios para la transacción.
        """
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        
        # Le avisamos a SQLAlchemy que el objeto cambió
        self.session.add(db_obj)
        return db_obj

    async def delete(self, db_obj: Pet) -> bool:
        """
        Elimina de forma física el registro de la mascota  base de datos.
        """
        await self.session.delete(db_obj)
        return True    
    
    async def count_all(self) -> int:
        """
        Devuelve el total de mascotas en PostgreSQL.
        """
        stmt = select(func.count()).select_from(Pet)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_paginated(self, offset: int, limit: int) -> list[Pet]:
        """Devuelve un lote paginado de mascotas."""
        stmt = select(Pet).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()