from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.core.constants import UserRole

# 1. Base compartida
class UserBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None

# 2. Creación: Aquí vive el password (solo entra, nunca sale)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

# 3. Actualización: Todo opcional para permitir actualizaciones parciales (PATCH)
class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None

# 4. Respuesta estándar (Muda y Segura)
class UserResponse(UserBase):
    id: UUID
    rol: UserRole
    created_at: datetime
    
    # Importante: Aquí NO incluimos el password
    model_config = ConfigDict(from_attributes=True)

# 5. Auth y Tokens
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# 6. Estadísticas para el Admin (Lógica de Dashboard)
class DashboardStats(BaseModel):
    users_count: int
    pets_count: int
    qrs_count: int
    scans_count: int # Agregamos scans para trazabilidad total