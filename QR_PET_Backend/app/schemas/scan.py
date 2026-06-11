from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import UserMinimal


# ============================================================================
# ESQUEMAS DE CREACIÓN / REGISTRO
# ============================================================================

class ScanCreate(BaseModel):
    """
    📥 ESQUEMA DE CREACIÓN
    Requerido para registrar un nuevo escaneo de QR desde el frontend.
    """
    qr_codigo: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
# ============================================================================
# ESQUEMAS DE MODIFICACIÓN / EDICIÓN
# ============================================================================

class ScanUpdate(BaseModel):
    """
    🛠️ ESQUEMA DE ACTUALIZACIÓN (Requerido por los endpoints)
    Mantiene la compatibilidad para operaciones PUT/PATCH en el router.
    """
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# ============================================================================
# RESPUESTAS BASE CORREGIDAS
# ============================================================================

class ScanResponse(BaseModel):
    """
    Response estándar de escaneo corregida a nivel global.
    Sana los conflictos de UUIDs y nomenclatura de fechas de la BD.
    """
    # 1. Cambiamos int a str para soportar tus UUIDs de texto libremente
    id: str 
    qr_codigo: str
    
    # 2. Mapeamos 'fecha' de la base de datos a 'created_at' por si otros endpoints lo usan así
    created_at: datetime = Field(validation_alias="fecha")
    
    # 3. Traemos los campos opcionales de geolocalización de manera segura
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion: Optional[str] = Field(default="Ubicación aproximada")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ============================================================================
# RESPUESTAS ESPECIALIZADAS (Mantienen consistencia automáticamente)
# ============================================================================

class ScanWithUserResponse(ScanResponse):
    """Escaneo con datos del usuario que lo reportó"""
    usuario: Optional[UserMinimal] = None

class ScanAdminResponse(ScanResponse):
    """Response para el panel de admin"""
    usuario: Optional[UserMinimal] = None


class ScanLocation(BaseModel):
    id: str
    qr_codigo: str # 🎯 Lee directo de 'qr_codigo'
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    pet_name: str # 🎯 Lee directo de 'pet_name'
    escaneado_en: datetime # 🎯 Lee directo de 'escaneado_en' (Fecha histórica real garantizada)
    direccion_aproximada: str # 🎯 Lee directo de 'direccion_aproximada'

    model_config = ConfigDict(from_attributes=True)