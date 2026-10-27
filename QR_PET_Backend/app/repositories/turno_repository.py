# app/repositories/turno_repository.py
import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import lazyload
from sqlalchemy import select, extract, and_, or_, union, func
from app.models.turno import Turno, EstadoTurno
from app.models.pet import Pet
from app.models.user import User
from app.models.historia_clinica import HistoriaClinica
from app.models.veterinario_mascota import veterinario_mascotas

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
        has_appointment = (
            select(Turno.id)
            .where(
                Turno.veterinario_id == veterinario_id,
                Turno.mascota_id == mascota_id,
            )
            .exists()
        )
        has_history = (
            select(HistoriaClinica.id)
            .where(
                HistoriaClinica.veterinario_id == veterinario_id,
                HistoriaClinica.mascota_id == mascota_id,
            )
            .exists()
        )
        has_explicit_link = (
            select(veterinario_mascotas.c.mascota_id)
            .where(
                veterinario_mascotas.c.veterinario_id == veterinario_id,
                veterinario_mascotas.c.mascota_id == mascota_id,
            )
            .exists()
        )
        query = select(Pet.id).where(
            Pet.id == mascota_id,
            has_appointment | has_history | has_explicit_link,
        ).limit(1)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_veterinarian_patients(self, veterinarian_id: uuid.UUID) -> List[Pet]:
        linked_pet_ids = union(
            select(Turno.mascota_id).where(Turno.veterinario_id == veterinarian_id),
            select(HistoriaClinica.mascota_id).where(
                HistoriaClinica.veterinario_id == veterinarian_id
            ),
            select(veterinario_mascotas.c.mascota_id).where(
                veterinario_mascotas.c.veterinario_id == veterinarian_id
            ),
        )
        result = await self.db.execute(
            select(Pet)
            .where(Pet.id.in_(linked_pet_ids))
            .order_by(Pet.nombre.asc())
        )
        return list(result.scalars().unique().all())

    async def has_direct_veterinarian_link(
        self, veterinarian_id: uuid.UUID, pet_id: uuid.UUID
    ) -> bool:
        query = select(veterinario_mascotas.c.mascota_id).where(
            veterinario_mascotas.c.veterinario_id == veterinarian_id,
            veterinario_mascotas.c.mascota_id == pet_id,
        ).limit(1)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_bookable_pet(self, pet_id: uuid.UUID) -> Optional[Pet]:
        query = (
            select(Pet)
            .join(User, User.id == Pet.usuario_id)
            .where(Pet.id == pet_id, User.rol == "usuario")
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

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

    def _assistant_query_filters(
        self,
        veterinarian_id: uuid.UUID,
        start: datetime,
        end: datetime,
        pet_name: Optional[str],
        state: Optional[EstadoTurno],
        include_cancelled: bool = False,
    ):
        filters = [
            Turno.veterinario_id == veterinarian_id,
            Turno.fecha_hora_inicio >= start,
            Turno.fecha_hora_inicio < end,
        ]
        if state is not None:
            filters.append(Turno.estado == state)
        elif not include_cancelled:
            filters.append(Turno.estado != EstadoTurno.CANCELADO)
        if pet_name:
            filters.append(Pet.nombre.ilike(f"%{pet_name.strip()}%"))
        return filters

    async def list_for_assistant(
        self,
        veterinarian_id: uuid.UUID,
        start: datetime,
        end: datetime,
        pet_name: Optional[str] = None,
        state: Optional[EstadoTurno] = None,
        limit: int = 50,
        include_cancelled: bool = False,
    ) -> list[tuple[Turno, str]]:
        query = (
            select(Turno, Pet.nombre)
            .join(Pet, Pet.id == Turno.mascota_id)
            .where(*self._assistant_query_filters(
                veterinarian_id, start, end, pet_name, state, include_cancelled
            ))
            .order_by(Turno.fecha_hora_inicio.asc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.all())

    async def count_for_assistant(
        self,
        veterinarian_id: uuid.UUID,
        start: datetime,
        end: datetime,
        pet_name: Optional[str] = None,
        state: Optional[EstadoTurno] = None,
        include_cancelled: bool = False,
    ) -> dict[str, int]:
        query = (
            select(Turno.estado, func.count(Turno.id))
            .join(Pet, Pet.id == Turno.mascota_id)
            .where(*self._assistant_query_filters(
                veterinarian_id, start, end, pet_name, state, include_cancelled
            ))
            .group_by(Turno.estado)
        )
        result = await self.db.execute(query)
        counts = {status.value: 0 for status in EstadoTurno}
        counts.update({status.value: count for status, count in result.all()})
        return counts

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