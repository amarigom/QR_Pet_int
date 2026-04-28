from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from uuid import UUID
from app.core.constants import UserRole

# 1. Base compartida
class UserBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None

# 2. Creación
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

# 3. Actualización
class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None

# 4. Respuesta estándar
class UserResponse(UserBase):
    id: UUID
    rol: UserRole
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# 5. Auth y Tokens
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Usamos string por seguridad en la resolución
    user: "UserResponse" 

# 6. Estadísticas para el Admin
class DashboardStats(BaseModel):
    users_count: int
    pets_count: int
    qrs_count: int
    scans_count: int

# --- REPARACIÓN DE REFERENCIAS ---
# Forzamos a Pydantic a reconstruir TokenResponse 
# para que encuentre correctamente a UserResponse
TokenResponse.model_rebuild()