"""
Endpoints para Recordatorios Veterinarios
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.reminder_service import ReminderService
from app.schemas.veterinary_reminder import VeterinaryReminderResponse
from app.core.exceptions import ResourceNotFoundException


router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get(
    "/pet/{pet_id}",
    summary="Recordatorios de mascota",
    description="Obtiene todos los recordatorios de una mascota"
)
async def get_pet_reminders(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene todos los recordatorios de una mascota"""
    try:
        service = ReminderService(db)
        result = await service.get_pet_reminders(pet_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pending",
    summary="Recordatorios pendientes",
    description="Obtiene recordatorios pendientes (solo admin)"
)
async def get_pending_reminders(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene recordatorios pendientes de enviar"""
    try:
        service = ReminderService(db)
        reminders = await service.get_pending_reminders()
        return {
            "pending": len(reminders),
            "reminders": reminders
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/{reminder_id}/send",
    summary="Enviar recordatorio",
    description="Envía manualmente un recordatorio (solo admin)"
)
async def send_reminder(
    reminder_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Envía manualmente un recordatorio"""
    try:
        service = ReminderService(db)
        result = await service.send_reminder(reminder_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/send-all",
    summary="Enviar todos los pendientes",
    description="Envía todos los recordatorios pendientes (solo admin)"
)
async def send_all_pending(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Envía todos los recordatorios pendientes"""
    try:
        service = ReminderService(db)
        result = await service.send_all_pending()
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/stats",
    summary="Estadísticas de recordatorios",
    description="Obtiene estadísticas generales de recordatorios"
)
async def get_reminder_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene estadísticas de recordatorios"""
    try:
        service = ReminderService(db)
        result = await service.get_statistics()
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
