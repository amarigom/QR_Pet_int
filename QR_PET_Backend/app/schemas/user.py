from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.core.constants import UserRole
from .scan import ScanResponse
from typing import List, Optional
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
    user: UserResponse  # Ya no necesita comillas porque UserResponse ya existe arriba

# 6. Estadísticas para el Admin
class DashboardStats(BaseModel):
    users_count: int
    pets_count: int
    qrs_count: int
    scans_count: int


class UserDashboardStats(BaseModel):
    pets_count: int
    qrs_count: int
    scans_count: int
    recent_scans: List[ScanResponse] = []
    
class Config:
        from_attributes = True
# Rebuilds simples y directos
UserResponse.model_rebuild()
TokenResponse.model_rebuild()
DashboardStats.model_rebuild()