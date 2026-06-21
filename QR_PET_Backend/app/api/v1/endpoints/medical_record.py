"""
Endpoints para Registros Médicos
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.medical_record_service import MedicalRecordService
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
)
from app.core.exceptions import ResourceNotFoundException, ValidationException


router = APIRouter(prefix="/medical-records", tags=["medical-records"])


@router.post(
    "",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear registro médico",
    description="Crea un nuevo registro médico. Solo veterinarios pueden hacerlo."
)
async def create_medical_record(
    pet_id: uuid.UUID,
    clinic_id: uuid.UUID,
    record_data: MedicalRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea un nuevo registro médico para una mascota"""
    try:
        service = MedicalRecordService(db)
        result = await service.create_medical_record(
            veterinarian_id=current_user.id,
            pet_id=pet_id,
            clinic_id=clinic_id,
            record_data=record_data
        )
        return result
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/{record_id}",
    response_model=MedicalRecordResponse,
    summary="Obtener registro médico",
    description="Obtiene detalles de un registro médico"
)
async def get_medical_record(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene detalles de un registro médico"""
    try:
        service = MedicalRecordService(db)
        result = await service.get_medical_record(record_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pet/{pet_id}",
    summary="Historial médico de mascota",
    description="Obtiene el historial clínico completo de una mascota"
)
async def get_pet_medical_history(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Obtiene el historial médico completo de una mascota"""
    try:
        service = MedicalRecordService(db)
        result = await service.get_pet_medical_history(
            pet_id=pet_id,
            limit=limit,
            offset=offset
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pet/{pet_id}/composite",
    summary="Historial médico composite",
    description="Obtiene historial completo: consultas, vacunas, tratamientos"
)
async def get_pet_medical_history_composite(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene historial médico en formato composite"""
    try:
        service = MedicalRecordService(db)
        result = await service.get_medical_history_composite(pet_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pet/{pet_id}/by-type/{tipo}",
    summary="Registros médicos por tipo",
    description="Obtiene registros de un tipo específico (consulta, vacunación, etc)"
)
async def get_records_by_type(
    pet_id: uuid.UUID,
    tipo: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene registros de un tipo específico"""
    try:
        service = MedicalRecordService(db)
        result = await service.get_records_by_type(pet_id, tipo)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/{record_id}",
    response_model=MedicalRecordResponse,
    summary="Actualizar registro médico",
    description="Actualiza un registro médico (solo quien lo creó)"
)
async def update_medical_record(
    record_id: uuid.UUID,
    record_data: MedicalRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza un registro médico"""
    try:
        service = MedicalRecordService(db)
        result = await service.update_medical_record(
            record_id=record_id,
            veterinarian_id=current_user.id,
            record_data=record_data
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar registro médico",
    description="Elimina un registro médico (solo quien lo creó)"
)
async def delete_medical_record(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina un registro médico"""
    try:
        service = MedicalRecordService(db)
        await service.delete_medical_record(
            record_id=record_id,
            veterinarian_id=current_user.id
        )
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
