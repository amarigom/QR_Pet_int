import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict

# Base con los datos comunes de la consulta médica
class HistoriaClinicaBase(BaseModel):
    motivo_consulta: str = Field(..., min_length=3, max_length=255, json_schema_extra={"example": "Control anual y vacunación"})
    diagnostico: Optional[str] = Field(None, json_schema_extra={"example": "Paciente felino en excelente estado."})
    tratamiento: Optional[str] = Field(None, json_schema_extra={"example": "Se aplica vacuna quíntuple felina."})
    peso_kg: Optional[float] = Field(None, ge=0.0, json_schema_extra={"example": 4.5})
    temperatura_c: Optional[float] = Field(None, ge=30.0, le=45.0, json_schema_extra={"example": 38.5})
    adjuntos: Optional[List[Any]] = Field(default=[], json_schema_extra={"example": []})

# Payload enviado por el cliente para registrar la consulta
class HistoriaClinicaCreate(HistoriaClinicaBase):
    mascota_id: uuid.UUID

# Payload para actualización parcial (PATCH)
class HistoriaClinicaUpdate(BaseModel):
    motivo_consulta: Optional[str] = Field(None, min_length=3, max_length=255)
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None
    peso_kg: Optional[float] = Field(None, ge=0.0)
    temperatura_c: Optional[float] = Field(None, ge=30.0, le=45.0)
    adjuntos: Optional[List[Any]] = None

# Respuesta HTTP serializada desde la BD
class HistoriaClinicaResponse(HistoriaClinicaBase):
    id: uuid.UUID
    veterinario_id: uuid.UUID
    mascota_id: uuid.UUID
    fecha_consulta: datetime
    created_at: datetime

    # Permite mapear directamente atributos del ORM de SQLAlchemy 2.0
    model_config = ConfigDict(from_attributes=True)