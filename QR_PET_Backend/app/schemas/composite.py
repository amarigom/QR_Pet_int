"""
Esquemas Compuestos (Composite)

IMPORTANTE: Módulo que ensambla respuestas complejas usando vistas anidadas.
Evita dependencias circulares importando SOLO de base.py, common.py y esquemas individuales.
Nunca importa directamente entre composite.py y los esquemas que se usan en endpoints.
"""

from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse
from app.schemas.auth import AuthResponse 

# Definimos el esquema de registro en la zona neutral
class AuthRegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        from_attributes = True

# ============================================================================
# IMPORTAR SOLO ESQUEMAS BASE Y MINIMAL
# ============================================================================

from app.schemas.base import (
    UserMinimal,
    PetMinimal,
    ScanMinimal,
    QRMinimal,
)
from app.schemas.user import UserResponse
from app.schemas.pet import PetResponse
from app.schemas.qr import QRResponse
from app.schemas.scan import ScanResponse


# ============================================================================
# VISTAS COMPUESTAS - Ensambles seguros
# ============================================================================

class PetWithOwner(PetResponse):
    """Mascota con datos de su dueño"""
    owner: Optional[UserResponse] = None


class PetDetailResponse(PetResponse):
    """Vista completa: Mascota + Dueño + QR"""
    owner: Optional[UserResponse] = None
    qr_code: Optional[QRResponse] = None


class UserWithPets(UserResponse):
    """Perfil del usuario con lista de mascotas"""
    pets: List[PetResponse] = []


class QRDetailResponse(QRResponse):
    """QR con su mascota y dueño asociado"""
    mascota: Optional[PetWithOwner] = None


class ScanDetailResponse(ScanResponse):
    """Historial de escaneo con detalle completo"""
    qr: Optional[QRDetailResponse] = None


class UserProfile(UserWithPets):
    """Vista total para Dashboard del usuario"""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# RECONSTRUCCIÓN SEGURA DE MODELOS
# ============================================================================
# Esto garantiza que Pydantic resuelva todas las referencias anidadas
# DESPUÉS de que todos los esquemas estén completamente definidos

PetWithOwner.model_rebuild()
PetDetailResponse.model_rebuild()
UserWithPets.model_rebuild()
QRDetailResponse.model_rebuild()
ScanDetailResponse.model_rebuild()
UserProfile.model_rebuild()
