from pydantic import BaseModel
from typing import Optional

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

class BusquedaQueryInput(BaseModel):
    query: str
    categoria: Optional[str] = None
    limit: int = 5