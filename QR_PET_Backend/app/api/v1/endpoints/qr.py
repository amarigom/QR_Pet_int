import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Esquemas (Atómicos y el Compuesto para detalle)
from app.schemas.common import SuccessResponse
from app.schemas.composite import QRDetailResponse
from app.schemas.qr import QRActivateData, QRCheckResponse

# 2. Core y Seguridad
from app.api.v1.dependencies import get_current_user, require_admin
from app.core.database import get_db
from app.services.qr_service import QRService

router = APIRouter(prefix="/qr", tags=["Códigos QR"])


@router.get("", response_model=Dict[str, Any])
async def list_qrs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None, max_length=100),
    assignment: str = Query("all", pattern="^(all|assigned|available)$"),
    tipo: str = Query("all", pattern="^(all|FISICO|CLINICO)$"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Lista códigos QR registrados (permite filtrar por FISICO o CLINICO)."""
    service = QRService(db)
    return await service.get_all_qrs(
        page=page,
        limit=limit,
        search=search,
        assignment=assignment,
        tipo=tipo,
    )


@router.get("/download-pdf")
async def download_lote_pdf(
    lote: str = Query(..., description="Nombre o identificador único del lote a descargar"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Genera y descarga una plantilla A4 en PDF con la grilla de QRs físicos de un lote."""
    service = QRService(db)
    return await service.export_lote_to_pdf(lote)


@router.get("/{qr_id}", response_model=QRDetailResponse)
async def get_qr_details(
    qr_id: uuid.UUID,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Obtiene detalles técnicos de un QR específico (incluye mascota, dueño y tipo)."""
    service = QRService(db)
    return await service.get_qr(qr_id)


@router.delete("/{qr_id}", response_model=SuccessResponse)
async def delete_qr(
    qr_id: uuid.UUID,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Elimina un código QR del sistema."""
    service = QRService(db)
    await service.delete_qr(qr_id)
    return SuccessResponse(message="Código QR eliminado correctamente")


@router.post("/activate", response_model=Dict[str, Any])
async def activate_qr(
    data: QRActivateData,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Usuario: Activa un código QR físico (medalla) y lo vincula a una mascota."""
    service = QRService(db)
    return await service.activate_qr(user.id, data)


@router.get("/check/{code}", response_model=QRCheckResponse)
async def check_qr_availability(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Público: Verifica el estado de un QR (Disponible, Vinculado, Clínico o No existe)."""
    service = QRService(db)
    return await service.check_qr_availability(code)