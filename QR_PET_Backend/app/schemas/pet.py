"""
Esquemas de Mascota (Pet)
- PetBase: Base para operaciones CRUD
- PetCreate: Request para crear mascota
- PetUpdate: Request para actualizar mascota
- PetResponse: Response estándar de mascota
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.core.constants import PetStatus, AnimalSpecies
from app.schemas.base import PetBase, PetMinimal,UserMinimal,QRMinimal


# ============================================================================
# OPERACIONES CRUD
# ============================================================================

class PetCreate(PetBase):
    """Schema para crear una mascota (Request)"""
    pass


class PetUpdate(BaseModel):
    """Schema para actualizar una mascota (Request)"""
    nombre: Optional[str] = Field(None, max_length=100) 
    especie: Optional[str] = None                       
    raza: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=100)
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[PetStatus] = None


# ============================================================================
# RESPUESTAS
# ============================================================================

class PetResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    nombre: str
    especie: str
    estado: str
    created_at: datetime
    raza: Optional[str] = None
    color: Optional[str] = None
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None  

    model_config = ConfigDict(from_attributes=True)


class PetDetailResponse(BaseModel):
    id: UUID
    nombre: str
    especie: str
    raza: Optional[str] = None
    color: Optional[str] = None
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None
    estado: str
    usuario_id: UUID
    created_at: datetime
    qr: Optional[QRMinimal] = Field(default=None, validation_alias="qr_code", serialization_alias="qr")
    owner: Optional[UserMinimal] = None 
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )
# ============================================================================
# INICIALIZACIÓN SEGURA
# ============================================================================

PetResponse.model_rebuild()
PetDetailResponse.model_rebuild()