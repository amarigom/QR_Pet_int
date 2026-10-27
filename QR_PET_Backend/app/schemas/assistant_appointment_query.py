from datetime import date, datetime
from typing import Literal
import uuid

from pydantic import BaseModel, ConfigDict, Field


class AssistantAppointmentQueryIntent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tipo_consulta: Literal["ninguna", "listar", "resumen"]
    fecha_desde: date | None = None
    fecha_hasta: date | None = None
    mascota_nombre: str | None = None
    estado: Literal["PROGRAMADO", "ATENDIDO", "CANCELADO"] | None = None


class AssistantAppointmentItem(BaseModel):
    id: uuid.UUID
    mascota_nombre: str
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    tipo_servicio: str
    estado: Literal["PROGRAMADO", "ATENDIDO", "CANCELADO"]


class AssistantAppointmentQueryResponse(BaseModel):
    estado: Literal["sin_consulta", "resultado", "aclaracion"]
    respuesta: str | None = None
    turnos: list[AssistantAppointmentItem] = Field(default_factory=list)
    resumen: dict[str, int] | None = None
