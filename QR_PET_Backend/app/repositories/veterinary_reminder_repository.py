"""
Repositorio para Recordatorios Veterinarios
"""
from typing import Optional, List
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_, not_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.veterinary_reminder import VeterinaryReminder


class VeterinaryReminderRepository(BaseRepository[VeterinaryReminder]):
    """Repository para gestionar recordatorios automáticos"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=VeterinaryReminder, session=session)

    async def get_by_pet_id(
        self,
        pet_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[VeterinaryReminder]:
        """Obtiene recordatorios de una mascota"""
        query = (
            select(VeterinaryReminder)
            .where(VeterinaryReminder.pet_id == pet_id)
            .order_by(VeterinaryReminder.fecha_programada.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_pending_to_send(
        self,
        limit: int = 100
    ) -> List[VeterinaryReminder]:
        """
        Obtiene recordatorios pendientes de enviar
        (no enviados, con fecha programada menor a ahora, intentos < 3)
        """
        now = datetime.utcnow()
        query = (
            select(VeterinaryReminder)
            .where(
                and_(
                    VeterinaryReminder.enviado == False,
                    VeterinaryReminder.fecha_programada <= now,
                    VeterinaryReminder.intentos_envio < 3
                )
            )
            .order_by(VeterinaryReminder.fecha_programada.asc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_type(
        self,
        tipo: str,
        pet_id: Optional[uuid.UUID] = None
    ) -> List[VeterinaryReminder]:
        """Obtiene recordatorios de un tipo específico"""
        conditions = [VeterinaryReminder.tipo == tipo]
        
        if pet_id:
            conditions.append(VeterinaryReminder.pet_id == pet_id)
        
        query = (
            select(VeterinaryReminder)
            .where(and_(*conditions))
            .order_by(VeterinaryReminder.fecha_programada.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_upcoming(
        self,
        pet_id: uuid.UUID,
        days: int = 7
    ) -> List[VeterinaryReminder]:
        """Obtiene recordatorios programados para los próximos N días"""
        now = datetime.utcnow()
        future = now + timedelta(days=days)
        
        query = (
            select(VeterinaryReminder)
            .where(
                and_(
                    VeterinaryReminder.pet_id == pet_id,
                    VeterinaryReminder.fecha_programada.between(now, future)
                )
            )
            .order_by(VeterinaryReminder.fecha_programada.asc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_recently_sent(
        self,
        pet_id: uuid.UUID,
        days: int = 7
    ) -> List[VeterinaryReminder]:
        """Obtiene recordatorios enviados en los últimos N días"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        query = (
            select(VeterinaryReminder)
            .where(
                and_(
                    VeterinaryReminder.pet_id == pet_id,
                    VeterinaryReminder.enviado == True,
                    VeterinaryReminder.fecha_enviado >= cutoff
                )
            )
            .order_by(VeterinaryReminder.fecha_enviado.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_pending(self) -> int:
        """Cuenta total de recordatorios pendientes de enviar"""
        now = datetime.utcnow()
        query = (
            select(func.count())
            .select_from(VeterinaryReminder)
            .where(
                and_(
                    VeterinaryReminder.enviado == False,
                    VeterinaryReminder.fecha_programada <= now
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_sent_today(self) -> int:
        """Cuenta recordatorios enviados hoy"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        query = (
            select(func.count())
            .select_from(VeterinaryReminder)
            .where(
                and_(
                    VeterinaryReminder.enviado == True,
                    VeterinaryReminder.fecha_enviado.between(today_start, today_end)
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_failed_reminders(
        self,
        limit: int = 100
    ) -> List[VeterinaryReminder]:
        """Obtiene recordatorios que fallaron al enviar"""
        query = (
            select(VeterinaryReminder)
            .where(
                and_(
                    VeterinaryReminder.enviado == False,
                    VeterinaryReminder.intentos_envio >= 3,
                    VeterinaryReminder.error_mensaje.isnot(None)
                )
            )
            .order_by(VeterinaryReminder.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
