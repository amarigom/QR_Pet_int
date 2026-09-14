# app/api/v1/endpoints/turnos.py
import uuid
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.turno import TurnoCreate, TurnoResponse, TurnoUpdateEstado
from app.services.turno_service import TurnoService

router = APIRouter()


@router.post("/", response_model=TurnoResponse, status_code=status.HTTP_201_CREATED)
async def agendar_turno(
    data: TurnoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Agenda un nuevo turno asociándolo al veterinario autenticado.
    """
    service = TurnoService(db)
    return await service.agendar_turno(data, current_user)


@router.get("/agenda", response_model=List[TurnoResponse], status_code=status.HTTP_200_OK)
async def obtener_agenda_dia(
    fecha: date = Query(..., description="Fecha a consultar (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recupera los turnos del veterinario agrupados por día.
    """
    service = TurnoService(db)
    return await service.obtener_agenda_dia(fecha, current_user.id)


@router.patch("/{turno_id}/estado", response_model=TurnoResponse, status_code=status.HTTP_200_OK)
async def cambiar_estado_turno(
    turno_id: uuid.UUID,
    payload: TurnoUpdateEstado,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cambia el estado de un turno (PROGRAMADO -> ATENDIDO / CANCELADO)
    aplicando las validaciones de las Strategies de estado.
    """
    service = TurnoService(db)
    return await service.cambiar_estado_turno(turno_id, payload)