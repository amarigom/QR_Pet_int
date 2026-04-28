from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

# 1. Base con los datos técnicos del escaneo
class ScanBase(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None
    telefono_encontrador: Optional[str] = None

# 2. Creación: Lo que recibimos del frontend
class ScanCreate(ScanBase):
    codigo: str = Field(..., min_length=1)

# 3. Respuesta estándar (La "Pieza de Lego")
class ScanResponse(ScanBase):
    id: UUID
    qr_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Rebuild limpio
ScanResponse.model_rebuild()