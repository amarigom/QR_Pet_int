import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException,status

from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.scan import ScanUpdate
from app.schemas.scan import ScanCreate, ScanResponse
from app.schemas.common import SuccessResponse, PaginatedResponse
from app.repositories.scan_repository import ScanRepository
# Si en algún momento necesitas el detalle completo (Scan + QR + Mascota)
# importarías ScanDetailResponse de app.schemas.composite

# 2. Core y Seguridad
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_admin
from app.services.scan_service import ScanService
from app.schemas.scan import ScanUpdate,ScanResponse, ScanLocation,ScanLocationUpdate
from uuid import UUID

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

@router.put("/{scan_id}", response_model=ScanResponse)
async def update_scan(
    scan_id: UUID,
    scan_data: ScanUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza un escaneo existente con ubicación o mensaje del encontrador.
    """
    service = ScanService(db)
    updated_scan = await service.update_scan_data(scan_id, scan_data)
    
    if not updated_scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Registro de escaneo no encontrado"
        )
    
    return updated_scan

@router.get("", response_model=PaginatedResponse[ScanLocation])
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
    """
    service = ScanService(db)
    return await service.get_pet_scans(pet_id, page, limit)
# En tu archivo de routers de scans
@router.post("/process/{codigo_qr}", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def process_scan_by_code(
    codigo_qr: str, 
    db: AsyncSession = Depends(get_db)
):
    """
    Público: Procesa el escaneo usando el código del QR (ej: -V9WPYPYNLW).
    Crea el registro y devuelve los datos de la mascota + scan_id.
    """
    service = ScanService(db)
    # Aquí deberías tener un método en el service que busque la mascota por código,
    # cree el escaneo y devuelva todo el combo.
    return await service.process_scan_from_qr(codigo_qr)

# =====================================================================
# ENDPOINT NUEVO: Exclusivo para la actualización rápida del transeúnte
# Convive con el PUT original sin romper tus mapas del frontend
# =====================================================================
@router.put("/{scan_id}/location")  # 🎯 Nueva ruta única
async def update_scan_location_express(
    scan_id: UUID,
    scan_data: ScanLocationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Ruta express para que el frontend del transeúnte actualice la ubicación
    de forma segura sin tocar el endpoint viejo del mapa.
    """
    service = ScanService(db)
    db_scan = await service.update_scan_location(scan_id, scan_data)
    
    if not db_scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Scan no encontrado"
        )
        
    return {
        "status": "success",
        "message": "Ubicación registrada con éxito",
        "id": str(scan_id)
    }
    
    # =====================================================================
# ENDPOINT NUEVO: Exclusivo para el mensaje de reporte del transeúnte
# Convive con el PUT original sin tocar tus esquemas Pydantic
# =====================================================================
@router.put("/{scan_id}/message")  # Nueva ruta única para el mensaje
async def update_scan_message_express(
    scan_id: UUID,
    scan_data: ScanUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Ruta express para que el transeúnte guarde el mensaje extra
    sin pasar por validadores asincrónicos.
    """
    service = ScanService(db)
    db_scan = await service.update_scan_location(scan_id, scan_data)
    
    if not db_scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Scan no encontrado"
        )
        
    return {
        "status": "success",
        "message": "Mensaje registrado con éxito",
        "id": str(scan_id)
    }