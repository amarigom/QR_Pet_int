from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from .pet import PetResponse


from app.schemas.pet import PetResponse 

class ScanBase(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None
    telefono_encontrador: Optional[str] = None

class ScanResponse(ScanBase):
    id: UUID
    qr_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Rebuild limpio
ScanResponse.model_rebuild()

class ScanAdminResponse(ScanResponse):
    """Esquema de escaneo enriquecido para la vista de administración"""
    mascota: Optional[PetResponse] = None
    qr_codigo: Optional[str] = None
    
class ScanListAdminResponse(BaseModel):
    """Esquema para la paginación de la lista de admin"""
    items: list[ScanAdminResponse]
    total: int
    page: int
    limit: int

class ScanCreate(ScanBase):
    codigo: str = Field(..., min_length=1)

# 3. Respuesta estándar (La "Pieza de Lego")

class ScanWithPetResponse(ScanResponse):
    # Agregamos la mascota al escaneo para la vista de Admin
    mascota: Optional[PetResponse] = None
    qr_codigo: Optional[str] = None
    
class ScanUpdate(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None
    
class ScanLocation(BaseModel):
    id: int
    latitud: float
    longitud: float
    mascota_nombre: str
    fecha: datetime

    class Config:
        from_attributes = True # Esto permite mapear desde objetos de SQLAlchemy