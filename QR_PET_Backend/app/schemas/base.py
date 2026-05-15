"""
Módulo base con esquemas primitivos y compartidos.
Sin dependencias externas entre esquemas.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List, Generic, TypeVar
from uuid import UUID
from app.core.constants import PetStatus, AnimalSpecies, UserRole

# Type variable para genéricos
T = TypeVar("T")


# ============================================================================
# ESQUEMAS MÍNIMOS - Base de datos pura (sin relaciones)
# ============================================================================

class UserMinimal(BaseModel):
    """Usuario mínimo: solo identificación y datos públicos"""
    id: UUID
    nombre: str
    avatar_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class PetMinimal(BaseModel):
    """Mascota mínima: solo identificación y nombre"""
    id: UUID
    nombre: str
    foto_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ScanMinimal(BaseModel):
    """Escaneo mínimo: solo datos de ubicación y fecha"""
    id: UUID
    qr_codigo: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    fecha: datetime
    direccion_aproximada: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class QRMinimal(BaseModel):
    """QR mínimo: solo código e identificación"""
    id: UUID
    codigo: str
    activo: bool
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BASES PARA OPERACIONES CRUD
# ============================================================================

class UserBase(BaseModel):
    """Base para datos de usuario (Request)"""
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None


class PetBase(BaseModel):
    """Base para datos de mascota"""
    nombre: str = Field(..., min_length=1, max_length=100)
    especie: AnimalSpecies
    raza: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=100)
    edad_aproximada: Optional[str] = None
    foto_url: Optional[str] = None
    notas: Optional[str] = None


class ScanBase(BaseModel):
    """Base para datos de escaneo"""
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None
    telefono_encontrador: Optional[str] = None


class QRBase(BaseModel):
    """Base para datos de QR"""
    codigo: str


# ============================================================================
# GENÉRICOS Y RESPUESTAS COMUNES
# ============================================================================

class MessageResponse(BaseModel):
    """Respuesta simple con mensaje"""
    message: str


class SuccessResponse(BaseModel, Generic[T]):
    """Respuesta estándar de éxito con datos genéricos"""
    success: bool = True
    message: str
    data: Optional[T] = None
    
    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    success: bool = False
    message: str
    errors: Optional[dict] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica"""
    items: List[T]
    total: int
    page: int
    limit: int
    pages: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
