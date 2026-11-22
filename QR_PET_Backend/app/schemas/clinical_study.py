from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

TipoArchivoEstudio = Literal["PDF", "DICOM", "IMAGE"]


class ClinicalStudyCreate(BaseModel):
    mascota_id: UUID
    titulo: str = Field(..., min_length=2, max_length=150)
    categoria: str = Field(..., min_length=2, max_length=50)
    tipo_archivo: TipoArchivoEstudio
    solicitado_por: Optional[str] = Field(default=None, max_length=120)
    notas_veterinario: Optional[str] = None
    fecha_estudio: Optional[datetime] = None


class ClinicalStudyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    mascota_id: UUID
    veterinario_id: Optional[UUID] = None
    solicitado_por: Optional[str] = None
    titulo: str
    categoria: str
    tipo_archivo: TipoArchivoEstudio
    tamano_bytes: Optional[int] = None
    notas_veterinario: Optional[str] = None
    fecha_estudio: datetime
    created_at: datetime


class ClinicalStudyWithAccessUrl(ClinicalStudyResponse):
    """Devuelve los metadatos junto con la URL prefirmada temporal para el visor web."""

    access_url: str
    expires_in_seconds: int = 900