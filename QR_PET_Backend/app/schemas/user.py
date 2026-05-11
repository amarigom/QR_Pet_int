"""
Esquemas de Usuario (User)
- UserBase: Base para operaciones CRUD
- UserCreate: Request para crear usuario (con password)
- UserUpdate: Request para actualizar usuario
- UserResponse: Response estándar de usuario
- UserLogin: Request para login
- TokenResponse: Response de token de autenticación
"""

from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.core.constants import UserRole
from app.schemas.base import UserBase, UserMinimal, ScanMinimal


# ============================================================================
# OPERACIONES CRUD
# ============================================================================

class UserCreate(UserBase):
    """Schema para crear un usuario (Request con password)"""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Schema para actualizar un usuario (Request)"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None


# ============================================================================
# RESPUESTAS
# ============================================================================

class UserResponse(UserMinimal, UserBase):
    """Response estándar de usuario (sin relaciones)"""
    rol: UserRole
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# AUTENTICACIÓN
# ============================================================================

class UserLogin(BaseModel):
    """Schema para login (Request)"""
    email: EmailStr
    password: str


# ============================================================================
# ESTADÍSTICAS
# ============================================================================

class DashboardStats(BaseModel):
    """Estadísticas del dashboard de admin"""
    users_count: int
    pets_count: int
    qrs_count: int
    scans_count: int
    recent_scans: List[ScanMinimal] = []

    model_config = ConfigDict(from_attributes=True)


class UserDashboardStats(BaseModel):
    """Estadísticas del dashboard del usuario"""
    pets_count: int
    qrs_count: int
    scans_count: int
    recent_scans: List[ScanMinimal] = []
    
    model_config = ConfigDict(from_attributes=True)
