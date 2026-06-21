"""
Endpoints para Citas/Turnos Veterinarios
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.appointment_service import AppointmentService
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from app.core.exceptions import ResourceNotFoundException, ValidationException


router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cita",
    description="Crea una nueva cita veterinaria"
)
async def create_appointment(
    pet_id: uuid.UUID,
    clinic_id: uuid.UUID,
    appointment_data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea una nueva cita"""
    try:
        service = AppointmentService(db)
        result = await service.create_appointment(
            pet_id=pet_id,
            clinic_id=clinic_id,
            appointment_data=appointment_data
        )
        return result
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Obtener cita",
    description="Obtiene detalles de una cita"
)
async def get_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene detalles de una cita"""
    try:
        service = AppointmentService(db)
        result = await service.get_appointment(appointment_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pet/{pet_id}",
    summary="Citas de mascota",
    description="Obtiene citas de una mascota"
)
async def get_pet_appointments(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    include_past: bool = Query(False),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Obtiene citas de una mascota"""
    try:
        service = AppointmentService(db)
        result = await service.get_pet_appointments(
            pet_id=pet_id,
            include_past=include_past,
            limit=limit,
            offset=offset
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pet/{pet_id}/next",
    response_model=AppointmentResponse,
    summary="Próxima cita",
    description="Obtiene la próxima cita de una mascota"
)
async def get_next_appointment(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene la próxima cita de una mascota"""
    try:
        service = AppointmentService(db)
        result = await service.get_next_appointment(pet_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No upcoming appointments")
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/clinic/{clinic_id}",
    summary="Citas de clínica",
    description="Obtiene citas de una clínica"
)
async def get_clinic_appointments(
    clinic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    estado: str = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Obtiene citas de una clínica"""
    try:
        service = AppointmentService(db)
        result = await service.get_clinic_appointments(
            clinic_id=clinic_id,
            estado=estado,
            limit=limit,
            offset=offset
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Actualizar cita",
    description="Actualiza datos de una cita"
)
async def update_appointment(
    appointment_id: uuid.UUID,
    appointment_data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza una cita"""
    try:
        service = AppointmentService(db)
        result = await service.update_appointment(
            appointment_id=appointment_id,
            appointment_data=appointment_data
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/{appointment_id}/confirm",
    response_model=AppointmentResponse,
    summary="Confirmar cita",
    description="Confirma una cita pendiente"
)
async def confirm_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Confirma una cita"""
    try:
        service = AppointmentService(db)
        result = await service.confirm_appointment(appointment_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    summary="Cancelar cita",
    description="Cancela una cita"
)
async def cancel_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    razon: str = Query(None)
):
    """Cancela una cita"""
    try:
        service = AppointmentService(db)
        result = await service.cancel_appointment(appointment_id, razon)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/{appointment_id}/complete",
    response_model=AppointmentResponse,
    summary="Completar cita",
    description="Marca una cita como completada"
)
async def complete_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    notas: str = Query(None)
):
    """Completa una cita"""
    try:
        service = AppointmentService(db)
        result = await service.complete_appointment(appointment_id, notas)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cita",
    description="Elimina una cita"
)
async def delete_appointment(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina una cita"""
    try:
        service = AppointmentService(db)
        await service.delete_appointment(appointment_id)
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
