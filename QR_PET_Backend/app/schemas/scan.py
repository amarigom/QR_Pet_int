from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from typing import Optional, List, TYPE_CHECKING


if TYPE_CHECKING:
    from app.schemas.qr import QRDetailResponse

# 1. Base con los datos técnicos del escaneo
class ScanBase(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None
    telefono_encontrador: Optional[str] = None

# 2. Creación: El usuario envía el 'codigo' del QR, no el ID de la base de datos
class ScanCreate(ScanBase):
    codigo: str = Field(..., min_length=1)

# 3. Respuesta estándar
class ScanResponse(ScanBase):
    id: UUID
    qr_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 4. Detalle Pro: Acceso a toda la cadena de información
class ScanDetailResponse(ScanResponse):
    """
    Gracias a la arquitectura por capas, si el Repo carga el QR,
    podemos acceder a la Mascota y al Dueño automáticamente.
    """
    
    # En lugar de campos sueltos, traemos el objeto QR (que ya trae Pet y Owner)
    qr: Optional[QRDetailResponse] = None
    


# --- AL FINAL DEL ARCHIVO scan.py ---
from app.schemas.qr import QRDetailResponse
ScanDetailResponse.model_rebuild()

