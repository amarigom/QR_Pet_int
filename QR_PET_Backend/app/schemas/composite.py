# app/schemas/composite.py
# app/schemas/composite.py
from typing import Optional, List
from pydantic import ConfigDict

# Importamos los modelos base
from app.schemas.user import UserResponse
from app.schemas.pet import PetResponse
from app.schemas.scan import ScanResponse
from app.schemas.qr import QRResponse

# --- VISTAS COMPUESTAS ---

class PetWithOwner(PetResponse):
    """Mascota con los datos de su dueño"""
    owner: Optional[UserResponse] = None

class PetDetailResponse(PetResponse):
    """Vista: Detalle total con QR y Dueño (La que pide pets.py)"""
    owner: Optional[UserResponse] = None
    qr_code: Optional[QRResponse] = None

class UserWithPets(UserResponse):
    """Perfil del usuario con la lista de sus mascotas"""
    pets: List[PetResponse] = []

class QRDetailResponse(QRResponse):
    """El QR con su mascota asociada y el dueño de la misma"""
    mascota: Optional[PetWithOwner] = None 

class ScanDetailResponse(ScanResponse):
    """El historial de escaneo con el detalle del QR y la mascota"""
    qr: Optional[QRDetailResponse] = None

class UserProfile(UserWithPets):
    """Vista total para el Dashboard"""
    model_config = ConfigDict(from_attributes=True)

# Rebuilds de seguridad para resolver las referencias cruzadas

PetWithOwner.model_rebuild()
PetDetailResponse.model_rebuild()
UserWithPets.model_rebuild()