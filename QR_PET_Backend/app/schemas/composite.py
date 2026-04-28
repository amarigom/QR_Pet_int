# app/schemas/composite.py
from typing import Optional, List
from app.schemas.scan import ScanResponse
from app.schemas.pet import PetResponse
from app.schemas.user import UserResponse
from app.schemas.qr import QRResponse # Cuando lo tengas listo
from typing import Optional, List
from app.schemas.user import UserResponse


class PetWithOwner(PetResponse):
    """Vista: Mascota con los datos de su dueño"""
    owner: Optional[UserResponse] = None

class PetDetailResponse(PetResponse):
    """Vista: Detalle total con QR y Dueño"""
    owner: Optional[UserResponse] = None
    qr_code: Optional[QRResponse] = None

class UserWithPets(UserResponse):
    """Vista: Perfil del usuario con sus mascotas"""
    pets: list[PetResponse] = []
        # app/schemas/composite.py


# --- NUEVAS VISTAS PARA QR ---

class QRDetailResponse(QRResponse):
    """
    Vista completa: El QR con su mascota (y la mascota con su dueño)
    Se usa cuando alguien escanea un QR activo.
    """
    mascota: Optional[PetWithOwner] = None 

class PetFullDetail(PetResponse):
    """
    Vista: Mascota con su Dueño Y su QR asociado.
    Ideal para el perfil detallado de la mascota.
    """
    owner: Optional[UserResponse] = None
    qr_code: Optional[QRResponse] = None
   


# --- VISTA PARA EL HISTORIAL DE ESCANEOS ---
class ScanDetailResponse(ScanResponse):
    """
    Vista completa: El Escaneo con los datos del QR involucrado.
    Como QRDetailResponse ya trae Mascota y Dueño, esta vista es total.
    """
    qr: Optional[QRDetailResponse] = None
 
# --- VISTA DE PERFIL COMPLETO ---
class UserProfile(UserResponse):
    """
    Vista: El usuario con todas sus mascotas.
    Útil para el dashboard principal del usuario.
    """
    pets: List[PetResponse] = []