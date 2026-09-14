# app/schemas/turno.py
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.turno import EstadoTurno

class TurnoBase(BaseModel):
    mascota_id: uuid.UUID
    dueno_id: Optional[uuid.UUID] = None
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    tipo_servicio: str
    observaciones: Optional[str] = None

class TurnoCreate(TurnoBase):
    pass

class TurnoUpdateEstado(BaseModel):
    nuevo_estado: EstadoTurno
    observaciones: Optional[str] = None

class TurnoResponse(TurnoBase):
    id: uuid.UUID
    veterinario_id: uuid.UUID
    estado: EstadoTurno
    recordatorio_enviado: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)