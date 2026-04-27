import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.scan import ScanCreate, ScanResponse
from app.schemas.common import SuccessResponse
from app.services.scan_service import ScanService
from app.api.v1.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/scans", tags=["Escaneos (Scans)"])

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_data: ScanCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Público: Registra un nuevo escaneo cuando alguien encuentra una mascota.
    No requiere autenticación.
    """
    service = ScanService(db)
    return await service.create_scan(scan_data)


@router.get("", response_model=Dict[str, Any])
async def get_all_scans(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Obtiene el historial global de todos los escaneos en el sistema.
    """
    service = ScanService(db)
    return await service.get_all_scans(page, limit)


@router.get("/pet/{pet_id}", response_model=Dict[str, Any])
async def get_pet_scans(
    pet_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Usuario: Obtiene el historial de escaneos de una mascota propia.
    El service verificará que la mascota pertenezca al usuario.
    """
    service = ScanService(db)
    return await service.get_pet_scans(pet_id, page, limit)