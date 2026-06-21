"""
Repositorio para Registros de Vacunación
"""
from typing import Optional, List
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.vaccination_record import VaccinationRecord
from app.models.medical_record import MedicalRecord


class VaccinationRecordRepository(BaseRepository[VaccinationRecord]):
    """Repository para gestionar registros de vacunación"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=VaccinationRecord, session=session)

    async def get_by_medical_record(
        self,
        medical_record_id: uuid.UUID
    ) -> List[VaccinationRecord]:
        """Obtiene todas las vacunas de un registro médico"""
        query = (
            select(VaccinationRecord)
            .where(VaccinationRecord.medical_record_id == medical_record_id)
            .order_by(VaccinationRecord.fecha_aplicacion.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_pet_id(
        self,
        pet_id: uuid.UUID
    ) -> List[VaccinationRecord]:
        """Obtiene todas las vacunaciones de una mascota"""
        query = (
            select(VaccinationRecord)
            .join(MedicalRecord)
            .where(MedicalRecord.pet_id == pet_id)
            .options(selectinload(VaccinationRecord.medical_record))
            .order_by(VaccinationRecord.fecha_aplicacion.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_vaccines_by_name(
        self,
        pet_id: uuid.UUID,
        nombre_vacuna: str
    ) -> List[VaccinationRecord]:
        """Obtiene todos los registros de una vacuna específica"""
        query = (
            select(VaccinationRecord)
            .join(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    VaccinationRecord.nombre_vacuna == nombre_vacuna
                )
            )
            .order_by(VaccinationRecord.fecha_aplicacion.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_overdue_vaccines(
        self,
        pet_id: uuid.UUID
    ) -> List[VaccinationRecord]:
        """Obtiene vacunas vencidas (próxima dosis pasada)"""
        now = datetime.utcnow()
        query = (
            select(VaccinationRecord)
            .join(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    VaccinationRecord.proxima_dosis < now
                )
            )
            .order_by(VaccinationRecord.proxima_dosis.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_upcoming_vaccines(
        self,
        pet_id: uuid.UUID,
        days: int = 30
    ) -> List[VaccinationRecord]:
        """Obtiene vacunas próximas a vencer en los próximos N días"""
        now = datetime.utcnow()
        future = now + timedelta(days=days)
        
        query = (
            select(VaccinationRecord)
            .join(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    VaccinationRecord.proxima_dosis.between(now, future)
                )
            )
            .order_by(VaccinationRecord.proxima_dosis.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_last_vaccine(
        self,
        pet_id: uuid.UUID,
        nombre_vacuna: str
    ) -> Optional[VaccinationRecord]:
        """Obtiene la última aplicación de una vacuna específica"""
        query = (
            select(VaccinationRecord)
            .join(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    VaccinationRecord.nombre_vacuna == nombre_vacuna
                )
            )
            .order_by(VaccinationRecord.fecha_aplicacion.desc())
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def count_by_pet(self, pet_id: uuid.UUID) -> int:
        """Cuenta total de vacunaciones de una mascota"""
        query = (
            select(func.count(VaccinationRecord.id))
            .select_from(VaccinationRecord)
            .join(MedicalRecord)
            .where(MedicalRecord.pet_id == pet_id)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
