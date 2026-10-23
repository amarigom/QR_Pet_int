from datetime import datetime
from typing import Literal, Optional, Union
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.historia_clinica import HistoriaClinicaCreate, HistoriaClinicaUpdate
from app.schemas.turno import TurnoCreate


class AssistantActionIntent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accion: Literal[
        "ninguna",
        "turno",
        "historia_clinica_nueva",
        "historia_clinica_actualizar",
    ]
    mascota_id: Optional[str] = None
    fecha_hora_inicio: Optional[datetime] = None
    fecha_hora_fin: Optional[datetime] = None
    tipo_servicio: Optional[str] = None
    observaciones: Optional[str] = None
    motivo_consulta: Optional[str] = None
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None
    peso_kg: Optional[float] = Field(default=None, ge=0)
    temperatura_c: Optional[float] = Field(default=None, ge=30, le=45)
    historia_clinica_id: Optional[str] = None


class ProposedAppointment(BaseModel):
    tipo: Literal["turno"] = "turno"
    mascota_nombre: str
    datos: TurnoCreate


class ProposedMedicalRecordCreate(BaseModel):
    tipo: Literal["historia_clinica_nueva"] = "historia_clinica_nueva"
    mascota_nombre: str
    datos: HistoriaClinicaCreate


class ProposedMedicalRecordUpdate(BaseModel):
    tipo: Literal["historia_clinica_actualizar"] = "historia_clinica_actualizar"
    historia_id: uuid.UUID
    mascota_nombre: str
    fecha_consulta: datetime
    motivo_actual: str
    datos_actualizados: HistoriaClinicaUpdate


ProposedAction = Union[
    ProposedAppointment,
    ProposedMedicalRecordCreate,
    ProposedMedicalRecordUpdate,
]


class AssistantActionProposalResponse(BaseModel):
    estado: Literal["sin_accion", "aclaracion", "propuesta"]
    mensaje: Optional[str] = None
    accion: Optional[ProposedAction] = None


class ConfirmAppointmentAction(BaseModel):
    tipo: Literal["turno"]
    datos: TurnoCreate


class ConfirmMedicalRecordCreateAction(BaseModel):
    tipo: Literal["historia_clinica_nueva"]
    datos: HistoriaClinicaCreate


class ConfirmMedicalRecordUpdateAction(BaseModel):
    tipo: Literal["historia_clinica_actualizar"]
    historia_id: uuid.UUID
    datos_actualizados: HistoriaClinicaUpdate


ConfirmAssistantAction = Union[
    ConfirmAppointmentAction,
    ConfirmMedicalRecordCreateAction,
    ConfirmMedicalRecordUpdateAction,
]


class AssistantActionConfirmRequest(BaseModel):
    accion: ConfirmAssistantAction = Field(discriminator="tipo")


class AssistantActionConfirmResponse(BaseModel):
    respuesta: str
    fuentes: list[dict] = Field(default_factory=list)
    turno_id: Optional[uuid.UUID] = None
    fecha_hora_inicio: Optional[datetime] = None
