"""
Repositorio para Citas/Turnos Veterinarios
"""
from typing import Optional, List
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.appointment import Appointment


class AppointmentRepository(BaseRepository[Appointment]):
    """Repository para gestionar citas veterinarias"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=Appointment, session=session)

    async def get_by_pet_id(
        self,
        pet_id: uuid.UUID,
        include_past: bool = False,
        limit: int = 100,
        offset: int = 0
    ) -> List[Appointment]:
        """Obtiene citas de una mascota"""
        conditions = [Appointment.pet_id == pet_id]
        
        if not include_past:
            conditions.append(Appointment.fecha_programada >= datetime.utcnow())

        query = (
            select(Appointment)
            .where(and_(*conditions))
            .options(
                selectinload(Appointment.veterinary_clinic),
                selectinload(Appointment.veterinarian)
            )
            .order_by(Appointment.fecha_programada.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_next_appointment(
        self,
        pet_id: uuid.UUID
    ) -> Optional[Appointment]:
        """Obtiene la próxima cita de una mascota"""
        query = (
            select(Appointment)
            .where(
                and_(
                    Appointment.pet_id == pet_id,
                    Appointment.fecha_programada >= datetime.utcnow()
                )
            )
            .options(selectinload(Appointment.veterinary_clinic))
            .order_by(Appointment.fecha_programada.asc())
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_clinic(
        self,
        clinic_id: uuid.UUID,
        estado: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Appointment]:
        """Obtiene citas de una clínica"""
        conditions = [Appointment.veterinary_clinic_id == clinic_id]
        if estado:
            conditions.append(Appointment.estado == estado)

        query = (
            select(Appointment)
            .where(and_(*conditions))
            .options(
                selectinload(Appointment.pet),
                selectinload(Appointment.veterinarian)
            )
            .order_by(Appointment.fecha_programada.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_veterinarian(
        self,
        veterinarian_id: uuid.UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Appointment]:
        """Obtiene citas asignadas a un veterinario"""
        conditions = [Appointment.veterinarian_id == veterinarian_id]
        
        if start_date:
            conditions.append(Appointment.fecha_programada >= start_date)
        if end_date:
            conditions.append(Appointment.fecha_programada <= end_date)

        query = (
            select(Appointment)
            .where(and_(*conditions))
            .options(selectinload(Appointment.pet))
            .order_by(Appointment.fecha_programada.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_pending_appointments(
        self,
        clinic_id: uuid.UUID,
        days_ahead: int = 7
    ) -> List[Appointment]:
        """Obtiene citas pendientes en los próximos N días"""
        start = datetime.utcnow()
        end = start + timedelta(days=days_ahead)

        query = (
            select(Appointment)
            .where(
                and_(
                    Appointment.veterinary_clinic_id == clinic_id,
                    Appointment.estado.in_(["pendiente", "confirmado"]),
                    Appointment.fecha_programada.between(start, end)
                )
            )
            .options(selectinload(Appointment.pet))
            .order_by(Appointment.fecha_programada.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_by_clinic_and_status(
        self,
        clinic_id: uuid.UUID,
        estado: str
    ) -> int:
        """Cuenta citas de una clínica por estado"""
        query = (
            select(func.count())
            .select_from(Appointment)
            .where(
                and_(
                    Appointment.veterinary_clinic_id == clinic_id,
                    Appointment.estado == estado
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_available_slots(
        self,
        clinic_id: uuid.UUID,
        fecha: datetime,
        duracion_minutos: int = 30
    ) -> List[tuple]:
        """
        Obtiene slots disponibles en una fecha
        Retorna lista de (hora_inicio, hora_fin) disponibles
        """
        # Horario: 8:00 a 18:00
        start_hour = 8
        end_hour = 18
        
        occupied_query = (
            select(Appointment.fecha_programada)
            .where(
                and_(
                    Appointment.veterinary_clinic_id == clinic_id,
                    Appointment.estado.in_(["confirmado"]),
                    Appointment.fecha_programada.cast_date == fecha.date()
                )
            )
        )
        
        result = await self.session.execute(occupied_query)
        occupied_times = [row[0] for row in result.all()]
        
        # Generar slots disponibles
        available_slots = []
        current = datetime.combine(fecha.date(), datetime.min.time()).replace(hour=start_hour)
        end = datetime.combine(fecha.date(), datetime.min.time()).replace(hour=end_hour)
        
        while current < end:
            slot_end = current + timedelta(minutes=duracion_minutos)
            
            # Verificar si el slot está disponible
            is_available = True
            for occupied in occupied_times:
                if current <= occupied < slot_end:
                    is_available = False
                    break
            
            if is_available:
                available_slots.append((current, slot_end))
            
            current = slot_end
        
        return available_slots
