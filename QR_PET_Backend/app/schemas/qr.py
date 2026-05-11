"""
Esquemas de Código QR (QR)
- QRBase: Base para operaciones CRUD
- QRCreate: Request para crear códigos QR
- QRResponse: Response estándar de QR
- QRActivateData: Data para activar un QR
- QRCheckResponse: Response para verificar disponibilidad de QR
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.base import QRBase, QRMinimal


# ============================================================================
# OPERACIONES CRUD
# ============================================================================

class QRCreate(BaseModel):
    """Schema para crear códigos QR (Request)"""
    cantidad: int = Field(1, ge=1, le=100)


# ============================================================================
# RESPUESTAS
# ============================================================================

class QRResponse(QRBase):
    """Response estándar de QR (sin relaciones)"""
    id: UUID
    mascota_id: Optional[UUID] = None
    activo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ACCIONES ESPECIALES
# ============================================================================

class QRActivateData(BaseModel):
    """Data para activar un QR con información de mascota (Request)"""
    codigo: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=1, max_length=100)
    especie: str
    raza: Optional[str] = None
    color: Optional[str] = None
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None


class QRCheckResponse(BaseModel):
    """Response para verificar disponibilidad de QR"""
    available: bool
    message: str
    has_pet: Optional[bool] = None


# ============================================================================
# INICIALIZACIÓN SEGURA
# ============================================================================

QRResponse.model_rebuild()
