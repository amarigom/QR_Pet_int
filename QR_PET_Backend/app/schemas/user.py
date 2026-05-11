from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.core.constants import UserRole
from .common import UserMinimal, ScanMinimal

# 1. Base para datos de entrada (Request)
class UserBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None

# 2. Creación (Request con password)
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

# 3. Actualización (Campos opcionales)
class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None

# 4. Respuesta estándar (Hereda de Minimal para tener el ID y de Base para el resto)
class UserResponse(UserMinimal, UserBase):
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
    user: UserResponse

# 6. Estadísticas para el Admin
class DashboardStats(BaseModel):
    users_count: int
    pets_count: int
    qrs_count: int
    scans_count: int
    # Agregamos los escaneos recientes usando el modelo común para romper el círculo
    recent_scans: List[ScanMinimal] = []

    model_config = ConfigDict(from_attributes=True)

class UserDashboardStats(BaseModel):
    pets_count: int
    qrs_count: int
    scans_count: int
    recent_scans: List[ScanMinimal] = []
    
    model_config = ConfigDict(from_attributes=True)