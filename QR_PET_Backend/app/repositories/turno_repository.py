# app/repositories/turno_repository.py
import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload
from sqlalchemy import select, extract, and_, or_
from app.models.turno import Turno, EstadoTurno
from app.models.pet import Pet
from app.models.user import User

class TurnoRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, turno: Turno) -> Turno:
        self.db.add(turno)
        await self.db.commit()
        await self.db.refresh(turno)
        return turno

    async def get_by_id(self, turno_id: uuid.UUID) -> Optional[Turno]:
        result = await self.db.execute(select(Turno).where(Turno.id == turno_id))
        return result.scalars().first()

    async def has_veterinarian_patient(
        self, veterinario_id: uuid.UUID, mascota_id: uuid.UUID
    ) -> bool:
        query = select(Turno.id).where(
            Turno.veterinario_id == veterinario_id,
            Turno.mascota_id == mascota_id,
        ).limit(1)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_agenda_dia(self, fecha: date, veterinario_id: Optional[uuid.UUID] = None) -> List[Turno]:
        """Recupera turnos no cancelados para un día específico."""
        query = select(Turno).where(
            and_(
                extract('year', Turno.fecha_hora_inicio) == fecha.year,
                extract('month', Turno.fecha_hora_inicio) == fecha.month,
                extract('day', Turno.fecha_hora_inicio) == fecha.day,
                Turno.estado != EstadoTurno.CANCELADO,
            )
        )
        if veterinario_id:
            query = query.where(Turno.veterinario_id == veterinario_id)
            
        result = await self.db.execute(query.order_by(Turno.fecha_hora_inicio.asc()))
        return list(result.scalars().all())

    async def get_weekly_agenda(
        self, inicio: datetime, fin: datetime, veterinario_id: uuid.UUID
    ) -> List[Turno]:
        query = (
            select(Turno)
            .where(
                Turno.veterinario_id == veterinario_id,
                Turno.estado != EstadoTurno.CANCELADO,
                Turno.fecha_hora_inicio >= inicio,
                Turno.fecha_hora_inicio < fin,
            )
            .order_by(Turno.fecha_hora_inicio.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_due_reminders(
        self,
        now: datetime,
        until: datetime,
        excluded_ids: list[uuid.UUID] | None = None,
    ) -> list[tuple[Turno, User, Pet]]:
        query = (
            select(Turno, User, Pet)
            .join(User, Turno.dueno_id == User.id)
            .join(Pet, Turno.mascota_id == Pet.id)
            .where(
                Turno.estado == EstadoTurno.PROGRAMADO,
                or_(Turno.recordatorio_enviado.is_(False), Turno.recordatorio_enviado.is_(None)),
                User.whatsapp_recordatorios_consent.is_(True),
                Turno.fecha_hora_inicio >= now,
                Turno.fecha_hora_inicio <= until,
            )
            .options(lazyload("*"))
            .order_by(Turno.fecha_hora_inicio.asc())
            .with_for_update(of=Turno, skip_locked=True)
            .limit(1)
        )
        if excluded_ids:
            query = query.where(Turno.id.not_in(excluded_ids))
        result = await self.db.execute(query)
        return list(result.all())

    async def update_estado(
        self,
        turno: Turno,
        nuevo_estado: EstadoTurno,
        observaciones: Optional[str] = None,
    ) -> Turno:
        turno.estado = nuevo_estado
        if observaciones is not None:
            turno.observaciones = observaciones
        await self.db.commit()
        await self.db.refresh(turno)
        return turno