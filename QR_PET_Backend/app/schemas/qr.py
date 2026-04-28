from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from typing import Optional, List, TYPE_CHECKING


if TYPE_CHECKING:
    from app.schemas.pet import PetWithOwner

# 1. Base para consistencia
class QRBase(BaseModel):
    codigo: str

# 2. Creación (Normalmente por un Admin o sistema)
class QRCreate(BaseModel):
    cantidad: int = Field(1, ge=1, le=100)

# 3. Respuesta estándar (Muda)
class QRResponse(QRBase):
    id: UUID
    mascota_id: Optional[UUID] = None
    activo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 4. Detalle Pro: En lugar de strings sueltos, usamos el esquema de Pet
class QRDetailResponse(QRResponse):
    """
    Si el Repo hizo un join con Pet y User, 
    Pydantic llenará esto automáticamente.
    """
    
    mascota: Optional[PetWithOwner] = None

# 5. Activación (Lo que envía el usuario al escanear un QR virgen)
class QRActivateData(BaseModel):
    codigo: str = Field(..., min_length=1)
    # Aquí podríamos heredar de PetCreate para no repetir campos
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
    
# --- AL FINAL DEL ARCHIVO qr.py ---
from app.schemas.pet import PetWithOwner    
QRDetailResponse.model_rebuild()