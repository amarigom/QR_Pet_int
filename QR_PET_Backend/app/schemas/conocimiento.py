from pydantic import BaseModel
from typing import Optional

from typing import Optional, List, Dict, Any
from pydantic import BaseModel

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

# ➕ Agregamos este esquema para la consulta RAG con historial
class PreguntaInput(BaseModel):
    pregunta: str
    categoria: Optional[str] = "general"
    limit: Optional[int] = 3
    historial: Optional[List[Dict[str, Any]]] = None