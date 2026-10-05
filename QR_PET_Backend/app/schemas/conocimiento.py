from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class IngestaTextoInput(BaseModel):
    doc_id: str
    titulo: str
    contenido: str
    categoria: str = "general"

class IngestaResponse(BaseModel):
    status: str
    message: str
    doc_id: str
    chunks_procesados: int


class DocumentoConocimientoResponse(BaseModel):
    doc_id: str
    titulo: str
    categoria: str
    source_type: str
    compartido: bool

class BusquedaQueryInput(BaseModel):
    query: str
    categoria: Optional[str] = None
    limit: int = 5

# ➕ Agregamos este esquema para la consulta RAG con historial
class PreguntaInput(BaseModel):
    pregunta: str = Field(..., min_length=1, max_length=4000)
    categoria: Optional[str] = "general"
    limit: int = Field(default=3, ge=1, le=10)
    historial: Optional[List[Dict[str, Any]]] = Field(default=None, max_length=12)