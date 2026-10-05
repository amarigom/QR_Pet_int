import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.turno import EstadoTurno
from app.schemas.historia_clinica import HistoriaClinicaResponse
from app.schemas.pet import PetResponse
from app.schemas.qr import QRResponse
from app.schemas.turno import TurnoResponse
from app.schemas.veterinario import VeterinarianClinicBrand


class VeterinarianClient(BaseModel):
    id: uuid.UUID
    nombre: str
    email: str
    telefono: Optional[str] = None
    mascotas_count: int
    pending_activation: bool

    model_config = ConfigDict(from_attributes=True)


class VeterinarianPet(BaseModel):
    id: uuid.UUID
    usuario_id: uuid.UUID
    nombre: str
    especie: str
    estado: str
    qr: Optional[QRResponse] = None

    model_config = ConfigDict(from_attributes=True)


class VeterinarianScan(BaseModel):
    id: str
    qr_codigo: str
    pet_name: str
    created_at: datetime
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    direccion_aproximada: Optional[str] = None


class VeterinarianQR(BaseModel):
    id: uuid.UUID
    codigo: str
    activo: bool
    mascota_id: Optional[uuid.UUID] = None
    mascota_nombre: str
    dueno_nombre: str

    model_config = ConfigDict(from_attributes=True)


class VeterinarianDashboardResponse(BaseModel):
    clinic: Optional[VeterinarianClinicBrand] = None
    clients: List[VeterinarianClient]
    available_clients: List[VeterinarianClient]
    pets: List[VeterinarianPet]
    available_pets: List[VeterinarianPet]
    qrs: List[VeterinarianQR]
    scans: List[VeterinarianScan]
    medical_records: List[HistoriaClinicaResponse]
    appointments: List[TurnoResponse]
