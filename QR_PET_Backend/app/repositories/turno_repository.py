# app/repositories/turno_repository.py
import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract, and_
from app.models.turno import Turno, EstadoTurno

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

    async def get_agenda_dia(self, fecha: date, veterinario_id: Optional[uuid.UUID] = None) -> List[Turno]:
        """Recupera los turnos programados para un día específico."""
        query = select(Turno).where(
            and_(
                extract('year', Turno.fecha_hora) == fecha.year,
                extract('month', Turno.fecha_hora) == fecha.month,
                extract('day', Turno.fecha_hora) == fecha.day
            )
        )
        if veterinario_id:
            query = query.where(Turno.veterinario_id == veterinario_id)
            
        result = await self.db.execute(query.order_by(Turno.fecha_hora.asc()))
        return list(result.scalars().all())

    async def update_estado(self, turno: Turno, nuevo_estado: EstadoTurno, notas: Optional[str] = None) -> Turno:
        turno.estado = nuevo_estado
        if notas:
            turno.notas = notas
        await self.db.commit()
        await self.db.refresh(turno)
        return turno