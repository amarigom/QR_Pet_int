from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.user import UserResponse

class PerfilVeterinarioCreate(BaseModel):
    nombre_clinica: str = Field(..., min_length=2, max_length=150)
    matricula: str = Field(..., min_length=3, max_length=50)
    especialidad: Optional[str] = None
    direccion_consultorio: Optional[str] = None
    telefono_agenda: Optional[str] = None

class RegistroVeterinarioCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    nombre: str
    telefono: Optional[str] = None
    perfil: PerfilVeterinarioCreate

class PerfilVeterinarioResponse(PerfilVeterinarioCreate):
    id: UUID
    user_id: UUID
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuthVeterinarioRegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    perfil: PerfilVeterinarioResponse