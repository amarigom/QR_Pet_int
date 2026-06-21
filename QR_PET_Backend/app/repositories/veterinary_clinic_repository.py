"""
Repositorio para Clínicas Veterinarias
Patrón: Repository-Service sin dependencias circulares
"""
from typing import Optional, List
import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.veterinary_clinic import VeterinaryClinic
from app.models.user import User


class VeterinaryClinicRepository(BaseRepository[VeterinaryClinic]):
    """Repository para gestionar clínicas veterinarias"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=VeterinaryClinic, session=session)

    async def get_by_id(self, clinic_id: uuid.UUID) -> Optional[VeterinaryClinic]:
        """Obtiene clínica con sus veterinarios cargados"""
        query = (
            select(VeterinaryClinic)
            .where(VeterinaryClinic.id == clinic_id)
            .options(selectinload(VeterinaryClinic.veterinarians))
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[VeterinaryClinic]:
        """Busca clínica por email"""
        query = select(VeterinaryClinic).where(VeterinaryClinic.email == email)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_admin_id(self, admin_id: uuid.UUID) -> List[VeterinaryClinic]:
        """Obtiene clínicas administradas por un admin específico"""
        query = (
            select(VeterinaryClinic)
            .where(VeterinaryClinic.admin_id == admin_id)
            .options(selectinload(VeterinaryClinic.veterinarians))
            .order_by(VeterinaryClinic.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_all_with_veterinarians(
        self, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[VeterinaryClinic]:
        """Listado de todas las clínicas con sus veterinarios"""
        query = (
            select(VeterinaryClinic)
            .options(joinedload(VeterinaryClinic.veterinarians))
            .order_by(VeterinaryClinic.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().unique().all())

    async def count_veterinarians(self, clinic_id: uuid.UUID) -> int:
        """Cuenta veterinarios en una clínica"""
        query = (
            select(func.count(User.id))
            .select_from(User)
            .where(User.veterinary_clinic_id == clinic_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_all_clinics(self) -> int:
        """Cuenta total de clínicas"""
        query = select(func.count()).select_from(VeterinaryClinic)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def search_by_location(
        self, 
        lat: float, 
        lon: float, 
        radius_km: float = 10.0
    ) -> List[VeterinaryClinic]:
        """
        Busca clínicas dentro de un radio (usando distancia aproximada)
        Nota: Para distancia real, usar PostGIS
        """
        # Aproximación simple: ±0.09 grados ≈ 10 km
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * (1 if lat == 0 else abs(lat).__cos__()))

        query = (
            select(VeterinaryClinic)
            .where(
                VeterinaryClinic.latitud.between(lat - lat_delta, lat + lat_delta),
                VeterinaryClinic.longitud.between(lon - lon_delta, lon + lon_delta)
            )
            .order_by(VeterinaryClinic.nombre)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
