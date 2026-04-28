from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from uuid import UUID
from app.core.constants import PetStatus, AnimalSpecies
from __future__ import annotations

# 1. Importaciones para Forward References (Evitan circularidad)
if TYPE_CHECKING:
    from app.schemas.user import UserResponse
    from app.schemas.qr import QRResponse

# 1. Base compartida
class PetBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    especie: AnimalSpecies
    raza: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=100)
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None

# 2. Esquema para CREACIÓN
class PetCreate(PetBase):
    pass

# 3. Esquema para ACTUALIZACIÓN
class PetUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    raza: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=100)
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[PetStatus] = None

# 4. Esquema de RESPUESTA BASE
class PetResponse(PetBase):
    id: UUID
    usuario_id: UUID
    estado: PetStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 5. Esquemas detallados (Relaciones)
class PetWithOwner(PetResponse):
    """
    Relación con el objeto 'owner' completo.
    Usamos string "UserResponse" para que Pydantic lo resuelva luego.
    """
    owner: Optional[UserResponse] = None

class PetDetailResponse(PetResponse):
    """
    Relación con el objeto 'qr_code'.
    Usamos string "QRResponse" para evitar problemas de carga.
    """
    qr_code: Optional[QRResponse] = None
    
# Importamos las clases reales aquí para que rebuild() las vea
from app.schemas.user import UserResponse
from app.schemas.qr import QRResponse    


