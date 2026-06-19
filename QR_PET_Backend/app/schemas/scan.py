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
    qr_codigo: str  # El frontend manda qr_codigo
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ESQUEMAS DE MODIFICACIÓN / EDICIÓN / GPS PRECISO
# ============================================================================

class ScanUpdate(BaseModel):
    """
    🛠️ ESQUEMA DE ACTUALIZACIÓN
    Mantiene la compatibilidad para operaciones PUT/PATCH generales.
    """
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = Field(default="Ubicación aproximada", validation_alias="direccion", serialization_alias="direccion")
    model_config = ConfigDict(from_attributes=True,populate_by_name=True)


class ScanLocationUpdate(BaseModel):
    """
    🛰️ ESQUEMA PARA ACTUALIZACIÓN DE GPS DESDE EL FRONTEND
    Contrato específico para cuando el transeúnte acepta compartir coordenadas.
    """
    latitud: float  # Requeridos para poder calcular el pin de Google Maps
    longitud: float

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# RESPUESTAS BASE CORREGIDAS (Compatibles con UUIDs)
# ============================================================================

class ScanResponse(BaseModel):
    """
    Response estándar de escaneo corregida a nivel global.
    Sana los conflictos de UUIDs y nomenclatura de fechas de la BD.
    """
    id: str  # Soporta tus UUIDs como string sin romper
    qr_codigo: str
    created_at: datetime  # 🎯 ¡Le sacamos el alias! Lee directo de 'created_at' de la BD
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion: Optional[str] = Field(default="Ubicación aproximada")

    model_config = ConfigDict(from_attributes=True)


class ScanWhatsAppResponse(BaseModel):
    """
    📲 RESPUESTA ESPECIALIZADA PARA EL BOTÓN DE WHATSAPP
    Devuelve los datos procesados para armar el link dinámico en Next.js.
    """
    scan_id: str
    status: str
    telefono_dueno: str
    pet_name: str
    google_maps_url: str

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# RESPUESTAS ESPECIALIZADAS PARA PANELES Y MAPAS
# ============================================================================

class ScanWithUserResponse(ScanResponse):
    """Escaneo con datos del usuario que lo reportó"""
    usuario: Optional[UserMinimal] = None


class ScanAdminResponse(ScanResponse):
    """Response para el panel de admin"""
    usuario: Optional[UserMinimal] = None


class ScanLocation(BaseModel):
    """Esquema analítico mapeado directo para listas detalladas o mapas de calor"""
    id: str
    qr_codigo: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    pet_name: str
    escaneado_en: datetime
    direccion_aproximada: str

    model_config = ConfigDict(from_attributes=True)