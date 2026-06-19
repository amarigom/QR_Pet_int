from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.base import UserMinimal

# ============================================================================
# 📥 1. ESQUEMAS DE ENTRADA (PAYLOADS DESDE EL FRONTEND)
# ============================================================================

class ScanCreate(BaseModel):
    """Requerido para registrar el impacto inicial del QR (Escaneo básico por IP)."""
    qr_codigo: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ScanLocationUpdate(BaseModel):
    """Contrato estricto para cuando el transeúnte acepta compartir GPS preciso."""
    latitud: float
    longitud: float

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 📤 2. ESQUEMAS DE SALIDA (RESPUESTAS UNIFICADAS Y SINCRONIZADAS CON NEON)
# ============================================================================

class ScanResponse(BaseModel):
    """
    🎯 RESPUESTA ESTÁNDAR Y ANALÍTICA UNIFICADA
    Se fusionó ScanResponse y ScanLocation. Mapea 1:1 con los campos reales de Neon.
    """
    id: str  # Soporta UUIDs como strings en Next.js
    qr_codigo: str
    created_at: datetime  # Nombre real en Neon
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = "Ubicación aproximada"  # Nombre real en Neon
    pet_name: Optional[str] = "Mascota"  # Incluido para el mapa de calor/listados

    model_config = ConfigDict(from_attributes=True)


class ScanWithUserResponse(ScanResponse):
    """
    👑 RESPUESTA EXTENDIDA (Antes ScanAdminResponse y ScanWithUserResponse)
    Se consolidó en una sola. Sirve tanto para el panel de usuario como para el Admin.
    """
    usuario: Optional[UserMinimal] = None


# ============================================================================
# 📲 3. RESPUESTAS ESPECIALIZADAS DE FLUJO
# ============================================================================

class ScanWhatsAppResponse(BaseModel):
    """Devuelve los datos procesados para armar el link dinámico y push notifications."""
    scan_id: str
    status: str
    telefono_dueno: Optional[str] = None
    pet_name: str
    google_maps_url: str

    model_config = ConfigDict(from_attributes=True)