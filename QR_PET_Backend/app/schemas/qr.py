from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

# 1. Base para consistencia
class QRBase(BaseModel):
    codigo: str

# 2. Creación
class QRCreate(BaseModel):
    cantidad: int = Field(1, ge=1, le=100)

# 3. Respuesta estándar (La "Pieza de Lego")
class QRResponse(QRBase):
    id: UUID
    mascota_id: Optional[UUID] = None
    activo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 4. Activación (Datos que vienen del frontend)
class QRActivateData(BaseModel):
    codigo: str = Field(..., min_length=1)
    nombre: str = Field(..., min_length=1, max_length=100)
    especie: str
    raza: Optional[str] = None
    color: Optional[str] = None
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None

class QRCheckResponse(BaseModel):
    available: bool
    message: str
    has_pet: Optional[bool] = None

# Rebuild limpio y seguro
QRResponse.model_rebuild()