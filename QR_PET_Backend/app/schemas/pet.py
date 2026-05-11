from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from uuid import UUID
from app.core.constants import PetStatus, AnimalSpecies

if TYPE_CHECKING:
    from app.schemas.user import UserResponse
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

# 4. Esquema de RESPUESTA BASE (La "Vista" básica de mascota)
class PetResponse(PetBase):
    id: UUID
    usuario_id: UUID
    estado: PetStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 5. Rebuild simple (Ya no hay imports circulares, así que no necesita argumentos)
PetResponse.model_rebuild()