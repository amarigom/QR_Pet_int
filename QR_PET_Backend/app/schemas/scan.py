"""
Esquemas de Escaneo (Scan)
- ScanBase: Base para operaciones CRUD
- ScanCreate: Request para crear escaneo
- ScanUpdate: Request para actualizar escaneo
- ScanResponse: Response estándar de escaneo
- ScanLocation: Específico para mapa (Frontend)
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.base import ScanBase, ScanMinimal, UserMinimal


# ============================================================================
# OPERACIONES CRUD
# ============================================================================

class ScanCreate(ScanBase):
    """Schema para crear un escaneo (Request)"""
    codigo: str = Field(..., min_length=1)


class ScanUpdate(BaseModel):
    """Schema para actualizar un escaneo (Request)"""
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None


# ============================================================================
# RESPUESTAS
# ============================================================================

class ScanResponse(ScanMinimal, ScanBase):
    """Response estándar de escaneo (sin relaciones)"""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# RESPUESTAS ESPECIALIZADAS
# ============================================================================

class ScanWithUserResponse(ScanResponse):
    """Escaneo con datos del usuario que lo reportó"""
    usuario: Optional[UserMinimal] = None
    
    model_config = ConfigDict(from_attributes=True)


class ScanAdminResponse(ScanResponse):
    """Response para el panel de admin"""
    usuario: Optional[UserMinimal] = None
    
    model_config = ConfigDict(from_attributes=True)


class ScanLocation(BaseModel):
    """Response específico para mapa de Tandil (Frontend)"""
    id: int
    latitud: float
    longitud: float
    mascota_nombre: str
    fecha: datetime

    model_config = ConfigDict(from_attributes=True)
