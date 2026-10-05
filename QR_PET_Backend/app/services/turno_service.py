# app/services/turno_service.py
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.turno import Turno, EstadoTurno
from app.models.user import User
from app.models.pet import Pet
from app.core.constants import UserRole
from app.repositories.turno_repository import TurnoRepository
from app.schemas.turno import TurnoCreate, TurnoUpdateEstado
from app.strategies.turno_state_strategy import EstadoTurnoFactory

class TurnoService:
    def __init__(self, db: AsyncSession):
        self.repository = TurnoRepository(db)

    async def agendar_turno(self, data: TurnoCreate, current_user: User) -> Turno:
        pet_result = await self.repository.db.execute(
            select(Pet)
            .join(User, User.id == Pet.usuario_id)
            .where(Pet.id == data.mascota_id, User.rol == UserRole.USER)
        )
        pet = pet_result.scalar_one_or_none()
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mascota no encontrada.")
        if data.dueno_id is not None and data.dueno_id != pet.usuario_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cliente seleccionado no es dueño de la mascota.",
            )

        # 1. Eliminar tzinfo para convertirlos a offset-naive (compatibles con TIMESTAMP WITHOUT TIME ZONE)
        inicio_naive = data.fecha_hora_inicio.replace(tzinfo=None) if data.fecha_hora_inicio.tzinfo else data.fecha_hora_inicio
        fin_naive = data.fecha_hora_fin.replace(tzinfo=None) if data.fecha_hora_fin.tzinfo else data.fecha_hora_fin

        # 2. Validar que la hora de fin sea posterior al inicio
        if fin_naive <= inicio_naive:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fecha y hora de fin debe ser posterior al inicio."
            )

        # 3. Instanciar el modelo con datetimes naive
        nuevo_turno = Turno(
            veterinario_id=current_user.id,
            mascota_id=data.mascota_id,
            dueno_id=pet.usuario_id,
            fecha_hora_inicio=inicio_naive,
            fecha_hora_fin=fin_naive,
            tipo_servicio=data.tipo_servicio,
            observaciones=data.observaciones,
            estado=EstadoTurno.PROGRAMADO,
            recordatorio_enviado=False,
            created_at=datetime.now(timezone.utc).replace(tzinfo=None)  # Naive UTC explícito
        )
        return await self.repository.create(nuevo_turno)

    async def obtener_agenda_dia(self, fecha: date, veterinario_id: uuid.UUID) -> List[Turno]:
        return await self.repository.get_agenda_dia(fecha, veterinario_id)

    async def obtener_agenda_semanal(
        self, inicio: datetime, fin: datetime, veterinario_id: uuid.UUID
    ) -> List[Turno]:
        duration = self._as_utc_naive(fin) - self._as_utc_naive(inicio)
        if not timedelta(days=7) - timedelta(hours=1) <= duration <= (
            timedelta(days=7) + timedelta(hours=1)
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La agenda debe abarcar exactamente siete días.",
            )
        inicio_utc = self._as_utc_naive(inicio)
        fin_utc = self._as_utc_naive(fin)
        return await self.repository.get_weekly_agenda(inicio_utc, fin_utc, veterinario_id)

    @staticmethod
    def _as_utc_naive(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    async def eliminar_turno(self, turno_id: uuid.UUID, veterinario: User) -> Turno:
        turno = await self.repository.get_by_id(turno_id)
        if not turno or turno.veterinario_id != veterinario.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turno no encontrado.")
        if turno.estado == EstadoTurno.CANCELADO:
            return turno
        strategy = EstadoTurnoFactory.obtener_estrategia(EstadoTurno.CANCELADO)
        strategy.validar_transicion(turno)
        return await self.repository.update_estado(
            turno=turno,
            nuevo_estado=EstadoTurno.CANCELADO,
        )

    async def cambiar_estado_turno(
        self, turno_id: uuid.UUID, payload: TurnoUpdateEstado, veterinario: User
    ) -> Turno:
        turno = await self.repository.get_by_id(turno_id)
        if not turno or turno.veterinario_id != veterinario.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Turno no encontrado."
            )

        if turno.estado == payload.nuevo_estado:
            return turno

        # Validar la transición con el patrón Strategy
        strategy = EstadoTurnoFactory.obtener_estrategia(payload.nuevo_estado)
        strategy.validar_transicion(turno)

        return await self.repository.update_estado(
            turno=turno, 
            nuevo_estado=payload.nuevo_estado, 
            observaciones=payload.observaciones
        )