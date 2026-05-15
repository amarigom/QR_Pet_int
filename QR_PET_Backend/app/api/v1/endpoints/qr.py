import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, status,HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


# 1. Imports de Esquemas (Atómicos y el Compuesto para detalle)
from app.schemas.qr import QRActivateData, QRCheckResponse
from app.schemas.composite import QRDetailResponse  # <--- La vista ensamblada
from app.schemas.common import SuccessResponse

# 2. Core y Seguridad
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_admin
from app.services.qr_service import QRService

router = APIRouter(prefix="/qr", tags=["Códigos QR"])

@router.post("/generate", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def generate_qrs(
    cantidad: int = Query(1, ge=1, le=100),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Genera nuevos códigos QR sin mascota asociada en lote."""
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
    service = QRService(db)
    return await service.get_all_qrs(page, limit)

@router.get("/{qr_id}", response_model=QRDetailResponse)
async def get_qr_details(
    qr_id: uuid.UUID, 
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Obtiene detalles técnicos de un QR específico (incluye mascota y dueño)."""
    service = QRService(db)
    return await service.get_qr(qr_id)

@router.delete("/{qr_id}", response_model=SuccessResponse)
async def delete_qr(
    qr_id: uuid.UUID, 
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Elimina un QR físico del sistema."""
    service = QRService(db)
    await service.delete_qr(qr_id)
    return SuccessResponse(message="Código QR eliminado correctamente")

@router.post("/activate", response_model=Dict[str, Any])
async def activate_qr(
    data: QRActivateData,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Usuario: Activa un código QR físico y lo vincula a una nueva mascota."""
    service = QRService(db)
    return await service.activate_qr(user["id"], data)

@router.get("/check/{code}", response_model=QRCheckResponse)
async def check_qr_availability(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Público: Verifica el estado de un QR (Disponible, Vinculado o No existe)."""
    service = QRService(db)
    return await service.check_qr_availability(code)