from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Importamos lo que necesitamos de la base común
from .common import UserMinimal, ScanMinimal

# Nota: Si PetResponse causa círculos, podrías usar un PetMinimal en common.py
from .pet import PetResponse 

class ScanBase(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None
    telefono_encontrador: Optional[str] = None

class ScanCreate(ScanBase):
    codigo: str = Field(..., min_length=1)

class ScanUpdate(BaseModel):
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None
    mensaje_encontrador: Optional[str] = None

# Respuesta extendiendo de ScanMinimal para asegurar consistencia
class ScanResponse(ScanMinimal, ScanBase):
    """Respuesta base de un escaneo con sus datos de creación."""
    # id, qr_codigo, fecha ya vienen de ScanMinimal
    model_config = ConfigDict(from_attributes=True)

class ScanWithPetResponse(ScanResponse):
    """Esquema enriquecido para la vista de administración o detalles."""
    mascota: Optional[PetResponse] = None
    # Podemos incluir al usuario que realizó el escaneo (si existe)
    usuario: Optional[UserMinimal] = None 
    
    model_config = ConfigDict(from_attributes=True)

# Reemplazamos ScanListAdminResponse por el PaginatedResponse genérico en los endpoints,
# pero si prefieres mantenerlo aquí, sería así:
class ScanAdminResponse(ScanWithPetResponse):
    """Alias o extensión para claridad en el panel de admin"""
    pass

class ScanLocation(BaseModel):
    """Específico para el mapa de Tandil (Frontend)"""
    id: int
    latitud: float
    longitud: float
    mascota_nombre: str
    fecha: datetime

    model_config = ConfigDict(from_attributes=True)