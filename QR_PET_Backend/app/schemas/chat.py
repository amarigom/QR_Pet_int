from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class MensajeHistorial(BaseModel):
    role: str  # "user" o "model" (o "assistant")
    content: str

class ChatQueryInput(BaseModel):
    pregunta: str
    historial: Optional[List[MensajeHistorial]] = []
    categoria: Optional[str] = None
    limit: Optional[int] = 3

class FuenteInfo(BaseModel):
    doc_id: str
    titulo: str
    categoria: str

class ChatQueryResponse(BaseModel):
    status: str
    respuesta: str
    fuentes: List[FuenteInfo]
    
class DocumentIngestInput(BaseModel):
    doc_id: str          # Ej: "doc_veterinaria_01"
    titulo: str          # Ej: "Vacunas requeridas para perros"
    contenido: str       # El texto completo del documento
    categoria: Optional[str] = "general"