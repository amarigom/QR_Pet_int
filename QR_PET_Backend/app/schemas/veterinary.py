"""
Schemas para el sistema veterinario (Clínicas, Registros Médicos, Citas, etc.)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum
import uuid


class VeterinaryClinicBase(BaseModel):
    """Base para clínicas veterinarias"""
    nombre: str = Field(..., min_length=1, max_length=255)
    direccion: str = Field(..., min_length=5, max_length=500)
    ciudad: str = Field(..., max_length=100)
    provincia: str = Field(..., max_length=100)
    codigo_postal: str = Field(..., max_length=10)
    telefono: str = Field(..., regex=r"^\+?[\d\s\-\(\)]{7,20}$")
    email: str = Field(..., regex=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    latitud: Optional[float] = Field(None, ge=-90, le=90)
    longitud: Optional[float] = Field(None, ge=-180, le=180)


class VeterinaryClinicCreate(VeterinaryClinicBase):
    """Para crear una clínica veterinaria"""
    pass


class VeterinaryClinicUpdate(BaseModel):
    """Para actualizar una clínica veterinaria"""
    nombre: Optional[str] = Field(None, max_length=255)
    direccion: Optional[str] = Field(None, max_length=500)
    ciudad: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = None
    email: Optional[str] = None


class VeterinaryClinicResponse(VeterinaryClinicBase):
    """Response de clínica veterinaria"""
    id: uuid.UUID
    admin_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class MedicalRecordBase(BaseModel):
    """Base para registros médicos"""
    tipo: str = Field(..., min_length=1, max_length=100)
    descripcion: str = Field(..., min_length=1, max_length=2000)
    diagnostico: Optional[str] = Field(None, max_length=1000)


class MedicalRecordCreate(MedicalRecordBase):
    """Para crear un registro médico"""
    pet_id: uuid.UUID
    veterinarian_id: uuid.UUID


class MedicalRecordUpdate(BaseModel):
    """Para actualizar un registro médico"""
    diagnostico: Optional[str] = None
    descripcion: Optional[str] = None


class MedicalRecordResponse(MedicalRecordBase):
    """Response de registro médico"""
    id: uuid.UUID
    pet_id: uuid.UUID
    veterinarian_id: uuid.UUID
    veterinary_clinic_id: uuid.UUID
    fecha_registro: datetime

    class Config:
        from_attributes = True


class AppointmentBase(BaseModel):
    """Base para citas veterinarias"""
    pet_id: uuid.UUID
    veterinarian_id: uuid.UUID
    fecha_hora: datetime = Field(...)
    duracion_minutos: int = Field(..., ge=15, le=180)
    motivo: str = Field(..., min_length=1, max_length=500)
    notas: Optional[str] = Field(None, max_length=1000)


class AppointmentCreate(AppointmentBase):
    """Para crear una cita"""
    pass


class AppointmentUpdate(BaseModel):
    """Para actualizar una cita"""
    fecha_hora: Optional[datetime] = None
    motivo: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[str] = None


class AppointmentConfirm(BaseModel):
    """Para confirmar una cita"""
    confirmado: bool = True


class AppointmentResponse(AppointmentBase):
    """Response de cita veterinaria"""
    id: uuid.UUID
    veterinary_clinic_id: uuid.UUID
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True


class VaccinationRecordCreate(BaseModel):
    """Para crear un registro de vacunación"""
    medical_record_id: uuid.UUID
    vacuna_nombre: str = Field(..., max_length=255)
    fecha_aplicacion: datetime
    proxima_dosis: Optional[datetime] = None
    lote: str = Field(..., max_length=100)


class VaccinationRecordResponse(VaccinationRecordCreate):
    """Response de vacunación"""
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TreatmentProgressCreate(BaseModel):
    """Para crear seguimiento de tratamiento"""
    medical_record_id: uuid.UUID
    medicamento: str = Field(..., max_length=255)
    dosis: str = Field(..., max_length=100)
    frecuencia: str = Field(..., max_length=100)
    duracion_dias: int = Field(..., ge=1, le=365)
    notas: Optional[str] = Field(None, max_length=1000)


class TreatmentProgressUpdate(BaseModel):
    """Para actualizar seguimiento"""
    estado: Optional[str] = None
    notas: Optional[str] = None


class TreatmentProgressResponse(TreatmentProgressCreate):
    """Response de progreso de tratamiento"""
    id: uuid.UUID
    veterinarian_id: uuid.UUID
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReminderCreate(BaseModel):
    """Para crear un recordatorio"""
    pet_id: uuid.UUID
    tipo: str = Field(..., regex="^(vaccine|appointment|treatment|other)$")
    titulo: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    fecha_recordatorio: datetime


class ReminderResponse(ReminderCreate):
    """Response de recordatorio"""
    id: uuid.UUID
    estado: str
    created_at: datetime

    class Config:
        from_attributes = True


class AIAssistantQuery(BaseModel):
    """Query para el asistente IA"""
    pregunta: str = Field(..., min_length=1, max_length=1000)
    contexto: Optional[str] = Field(None, regex="^(general|pre_appointment|post_treatment)$")
    pet_id: Optional[uuid.UUID] = None
    appointment_id: Optional[uuid.UUID] = None


class AIAssistantResponse(BaseModel):
    """Response del asistente IA"""
    respuesta: str
    confidence: float = Field(..., ge=0, le=1)
    fuentes: Optional[List[str]] = None

    class Config:
        from_attributes = True
