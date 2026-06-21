"""
Repositorio para Registros Médicos
"""
from typing import Optional, List
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.medical_record import MedicalRecord
from app.models.pet import Pet


class MedicalRecordRepository(BaseRepository[MedicalRecord]):
    """Repository para gestionar registros médicos"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=MedicalRecord, session=session)

    async def get_by_pet_id(
        self,
        pet_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[MedicalRecord]:
        """Obtiene historial clínico completo de una mascota"""
        query = (
            select(MedicalRecord)
            .where(MedicalRecord.pet_id == pet_id)
            .options(
                selectinload(MedicalRecord.veterinarian),
                selectinload(MedicalRecord.veterinary_clinic),
                selectinload(MedicalRecord.vaccination_records),
                selectinload(MedicalRecord.treatment_progress)
            )
            .order_by(MedicalRecord.fecha_registro.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_type(
        self,
        pet_id: uuid.UUID,
        tipo: str
    ) -> List[MedicalRecord]:
        """Obtiene registros médicos de un tipo específico"""
        query = (
            select(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    MedicalRecord.tipo == tipo
                )
            )
            .order_by(MedicalRecord.fecha_registro.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_veterinarian(
        self,
        veterinarian_id: uuid.UUID,
        clinic_id: Optional[uuid.UUID] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[MedicalRecord]:
        """Obtiene registros creados por un veterinario"""
        conditions = [MedicalRecord.veterinarian_id == veterinarian_id]
        if clinic_id:
            conditions.append(MedicalRecord.veterinary_clinic_id == clinic_id)

        query = (
            select(MedicalRecord)
            .where(and_(*conditions))
            .options(selectinload(MedicalRecord.pet))
            .order_by(MedicalRecord.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_clinic(
        self,
        clinic_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[MedicalRecord]:
        """Obtiene todos los registros de una clínica"""
        query = (
            select(MedicalRecord)
            .where(MedicalRecord.veterinary_clinic_id == clinic_id)
            .options(selectinload(MedicalRecord.pet))
            .order_by(MedicalRecord.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_recent_for_pet(
        self,
        pet_id: uuid.UUID,
        days: int = 30
    ) -> List[MedicalRecord]:
        """Obtiene registros recientes de una mascota"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = (
            select(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    MedicalRecord.fecha_registro >= cutoff_date
                )
            )
            .order_by(MedicalRecord.fecha_registro.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_pet(self, pet_id: uuid.UUID) -> int:
        """Cuenta total de registros de una mascota"""
        query = (
            select(func.count())
            .select_from(MedicalRecord)
            .where(MedicalRecord.pet_id == pet_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_by_clinic(self, clinic_id: uuid.UUID) -> int:
        """Cuenta total de registros en una clínica"""
        query = (
            select(func.count())
            .select_from(MedicalRecord)
            .where(MedicalRecord.veterinary_clinic_id == clinic_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
