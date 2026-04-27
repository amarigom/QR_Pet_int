from typing import Optional, List, Any
import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.repositories.base import BaseRepository
from app.models.pet import Pet
from app.models.qr import QRCode

class PetRepository(BaseRepository[Pet]):
    """Repository especializado en Mascotas"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=Pet, session=session)

    async def get_by_id(self, pet_id: uuid.UUID) -> Optional[Pet]:
        """
        Sobrescribe el genérico para cargar relaciones necesarias.
        Esto evita errores de 'MissingGreenlet' al acceder a owner o qr_codes.
        """
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

    async def get_by_user(self, usuario_id: uuid.UUID, limit: int = 100, offset: int = 0) -> List[Pet]:
        """Obtiene mascotas de un usuario específico"""
        query = (
            select(Pet)
            .where(Pet.usuario_id == usuario_id)
            .options(selectinload(Pet.owner))
            .order_by(Pet.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_user(self, usuario_id: uuid.UUID) -> int:
        """Cuenta eficiente de mascotas por usuario"""
        query = (
            select(func.count())
            .select_from(Pet)
            .where(Pet.usuario_id == usuario_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_by_qr_code(self, qr_code: str) -> Optional[Pet]:
        """
        Obtiene la mascota asociada a un CÓDIGO de QR (ej: 'PET-123').
        Útil para la trazabilidad cuando alguien escanea una placa.
        """
        query = (
            select(Pet)
            .join(QRCode, QRCode.mascota_id == Pet.id)
            .where(QRCode.codigo == qr_code)
            .options(selectinload(Pet.owner))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all_with_owner(self, limit: int = 100, offset: int = 0) -> List[Pet]:
        """Uso de joinedload para el listado de Admin (más eficiente para listas largas)"""
        query = (
            select(Pet)
            .options(joinedload(Pet.owner))
            .order_by(Pet.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().unique().all())
    
    async def get_by_id_with_owner(self, pet_id: UUID) -> Optional[Pet]:
        """Reutiliza la lógica para buscar una sola mascota"""
        query = (
            select(Pet)
            .options(joinedload(Pet.owner))
            .where(Pet.id == pet_id)
        )
        result = await self.session.execute(query)
        return result.scalars().unique().one_or_none()