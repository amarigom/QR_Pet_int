"""
Endpoints para Clínicas Veterinarias
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.veterinary_clinic_service import VeterinaryClinicService
from app.schemas.veterinary_clinic import (
    VeterinaryClinicCreate,
    VeterinaryClinicUpdate,
    VeterinaryClinicResponse,
    VeterinaryClinicDetailResponse,
)
from app.core.exceptions import ResourceNotFoundException, ValidationException


router = APIRouter(prefix="/veterinary-clinics", tags=["veterinary-clinics"])


@router.post(
    "",
    response_model=VeterinaryClinicDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear clínica veterinaria",
    description="Crea una nueva clínica veterinaria. Solo ADMIN puede hacerlo."
)
async def create_clinic(
    clinic_data: VeterinaryClinicCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea una nueva clínica veterinaria"""
    try:
        service = VeterinaryClinicService(db)
        result = await service.create_clinic(
            admin_id=current_user.id,
            clinic_data=clinic_data
        )
        return result
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/{clinic_id}",
    response_model=VeterinaryClinicDetailResponse,
    summary="Obtener clínica",
    description="Obtiene detalles de una clínica incluyendo veterinarios"
)
async def get_clinic(
    clinic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene detalles de una clínica"""
    try:
        service = VeterinaryClinicService(db)
        result = await service.get_clinic(clinic_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "",
    summary="Listar clínicas",
    description="Obtiene lista de clínicas del administrador actual"
)
async def list_clinics(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0
):
    """Obtiene las clínicas del administrador actual"""
    try:
        service = VeterinaryClinicService(db)
        result = await service.get_clinics_by_admin(
            admin_id=current_user.id,
            limit=limit,
            offset=offset
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/{clinic_id}",
    response_model=VeterinaryClinicDetailResponse,
    summary="Actualizar clínica",
    description="Actualiza datos de una clínica (solo admin que la creó)"
)
async def update_clinic(
    clinic_id: uuid.UUID,
    clinic_data: VeterinaryClinicUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza datos de una clínica"""
    try:
        service = VeterinaryClinicService(db)
        result = await service.update_clinic(
            clinic_id=clinic_id,
            admin_id=current_user.id,
            clinic_data=clinic_data
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/{clinic_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar clínica",
    description="Elimina una clínica (solo admin que la creó)"
)
async def delete_clinic(
    clinic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina una clínica"""
    try:
        service = VeterinaryClinicService(db)
        await service.delete_clinic(clinic_id=clinic_id, admin_id=current_user.id)
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/{clinic_id}/stats",
    summary="Estadísticas de clínica",
    description="Obtiene estadísticas de una clínica"
)
async def get_clinic_stats(
    clinic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene estadísticas de una clínica"""
    try:
        service = VeterinaryClinicService(db)
        result = await service.get_clinic_stats(clinic_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
