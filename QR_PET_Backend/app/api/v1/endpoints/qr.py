import uuid
from typing import Dict, Any, TYPE_CHECKING
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

# Importaciones básicas seguras
from app.core.database import get_db
from app.schemas.common import SuccessResponse
from app.api.v1.dependencies import get_current_user, require_admin

# Bloque para el editor de código (VS Code)
if TYPE_CHECKING:
    from app.schemas.qr import QRActivateData, QRCheckResponse, QRDetailResponse
    from app.models.user import User

router = APIRouter(prefix="/qr", tags=["Códigos QR"])

@router.post("/generate", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def generate_qrs(
    cantidad: int = Query(1, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Genera nuevos códigos QR sin mascota asociada en lote."""
    from app.services.qr_service import QRService
    service = QRService(db)
    return await service.generate_qrs(cantidad, admin_user=admin)


@router.get("", response_model=Dict[str, Any])
async def list_qrs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Lista todos los códigos QR registrados."""
    from app.services.qr_service import QRService
    service = QRService(db)
    return await service.get_all_qrs(page, limit)


@router.get("/{qr_id}", response_model="QRDetailResponse") # <-- STRING
async def get_qr_details(
    qr_id: uuid.UUID, 
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Obtiene detalles técnicos de un QR específico."""
    from app.services.qr_service import QRService
    from app.schemas.qr import QRDetailResponse
    
    service = QRService(db)
    return await service.get_qr(qr_id)


@router.delete("/{qr_id}", response_model=SuccessResponse)
async def delete_qr(
    qr_id: uuid.UUID, 
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Elimina un QR físico del sistema."""
    from app.services.qr_service import QRService
    service = QRService(db)
    await service.delete_qr(qr_id)
    return SuccessResponse(message="Código QR eliminado correctamente")


@router.post("/activate", response_model=Dict[str, Any])
async def activate_qr(
    data: "QRActivateData", # <-- STRING
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Usuario: Activa un código QR físico y lo vincula a una nueva mascota."""
    from app.services.qr_service import QRService
    from app.schemas.qr import QRActivateData
    
    service = QRService(db)
    # user["id"] es el UUID del usuario autenticado
    return await service.activate_qr(user["id"], data)


@router.get("/check/{code}", response_model="QRCheckResponse") # <-- STRING
async def check_qr_availability(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Público: Verifica el estado de un QR (Disponible, Vinculado o No existe)."""
    from app.services.qr_service import QRService
    from app.schemas.qr import QRCheckResponse
    
    service = QRService(db)
    return await service.check_qr_availability(code)