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
from app.schemas.base import PetBase, PetMinimal,UserMinimal


# ============================================================================
# OPERACIONES CRUD
# ============================================================================

class PetCreate(PetBase):
    """Schema para crear una mascota (Request)"""
    pass


class PetUpdate(BaseModel):
    """Schema para actualizar una mascota (Request)"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    raza: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=100)
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[PetStatus] = None


# ============================================================================
# RESPUESTAS
# ============================================================================

class PetResponse(PetBase):
    """Response estándar de mascota (sin relaciones)"""
    id: UUID
    usuario_id: UUID
    estado: PetStatus
    created_at: datetime
    foto_url: Optional[str] = None
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
    
    # Aquí incluimos la relación que el repo ya cargó con selectinload
    owner: Optional[UserMinimal] = None 
    
    # Importante para que Pydantic lea los objetos de SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
# ============================================================================
# INICIALIZACIÓN SEGURA
# ============================================================================

PetResponse.model_rebuild()
