from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List, Generic, TypeVar
from uuid import UUID

# Definimos un tipo variable para los datos
T = TypeVar("T")

class MessageResponse(BaseModel):
    message: str

class SuccessResponse( BaseModel,Generic[T]):
    """Ahora podemos decir exactamente qué hay en 'data'"""
    success: bool = True
    message: str
    data: Optional[T] = None
    
    # Esto permite que Pydantic lea modelos de SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

class PaginatedResponse(BaseModel, Generic[T]):
    """El estándar de oro para listas"""
    items: List[T]
    total: int
    page: int
    limit: int  # Cambiamos page_size por limit para que coincida con SQL
    pages: int

    model_config = ConfigDict(from_attributes=True)

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[Any] = None
    
class UserMinimal(BaseModel):
    id: UUID
    nombre: str
    avatar_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ScanMinimal(BaseModel):
    id: int
    qr_codigo: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    fecha: datetime
    direccion_aproximada: Optional[str] = None
    model_config = ConfigDict(from_attributes=True) 