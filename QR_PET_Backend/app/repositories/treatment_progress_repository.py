"""
Repositorio para Progreso de Tratamientos
"""
from typing import List
import uuid
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.treatment_progress import TreatmentProgress
from app.models.medical_record import MedicalRecord


class TreatmentProgressRepository(BaseRepository[TreatmentProgress]):
    """Repository para gestionar el progreso de tratamientos"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=TreatmentProgress, session=session)

    async def get_by_medical_record(
        self,
        medical_record_id: uuid.UUID
    ) -> List[TreatmentProgress]:
        """Obtiene todo el progreso de un tratamiento"""
        query = (
            select(TreatmentProgress)
            .where(TreatmentProgress.medical_record_id == medical_record_id)
            .options(selectinload(TreatmentProgress.veterinarian))
            .order_by(TreatmentProgress.fecha_reporte.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_pet_id(
        self,
        pet_id: uuid.UUID,
        estado: str = None
    ) -> List[TreatmentProgress]:
        """Obtiene todo el progreso de tratamientos de una mascota"""
        conditions = []
        
        query_base = (
            select(TreatmentProgress)
            .join(MedicalRecord)
            .where(MedicalRecord.pet_id == pet_id)
        )
        
        if estado:
            query_base = query_base.where(TreatmentProgress.estado == estado)
        
        query = (
            query_base
            .options(
                selectinload(TreatmentProgress.medical_record),
                selectinload(TreatmentProgress.veterinarian)
            )
            .order_by(TreatmentProgress.fecha_reporte.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_latest_by_medical_record(
        self,
        medical_record_id: uuid.UUID
    ) -> TreatmentProgress | None:
        """Obtiene el reporte más reciente de un tratamiento"""
        query = (
            select(TreatmentProgress)
            .where(TreatmentProgress.medical_record_id == medical_record_id)
            .options(selectinload(TreatmentProgress.veterinarian))
            .order_by(TreatmentProgress.fecha_reporte.desc())
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_veterinarian(
        self,
        veterinarian_id: uuid.UUID,
        estado: str = None
    ) -> List[TreatmentProgress]:
        """Obtiene reportes de progreso creados por un veterinario"""
        conditions = [TreatmentProgress.veterinarian_id == veterinarian_id]
        
        if estado:
            conditions.append(TreatmentProgress.estado == estado)
        
        query = (
            select(TreatmentProgress)
            .where(and_(*conditions))
            .options(
                selectinload(TreatmentProgress.medical_record),
                selectinload(TreatmentProgress.veterinarian)
            )
            .order_by(TreatmentProgress.fecha_reporte.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_status(
        self,
        medical_record_id: uuid.UUID,
        estado: str
    ) -> int:
        """Cuenta reportes por estado"""
        query = (
            select(func.count())
            .select_from(TreatmentProgress)
            .where(
                and_(
                    TreatmentProgress.medical_record_id == medical_record_id,
                    TreatmentProgress.estado == estado
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_in_progress(
        self,
        pet_id: uuid.UUID
    ) -> List[TreatmentProgress]:
        """Obtiene tratamientos en progreso de una mascota"""
        query = (
            select(TreatmentProgress)
            .join(MedicalRecord)
            .where(
                and_(
                    MedicalRecord.pet_id == pet_id,
                    TreatmentProgress.estado == "en_progreso"
                )
            )
            .options(selectinload(TreatmentProgress.medical_record))
            .order_by(TreatmentProgress.fecha_reporte.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
