import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
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


class PerfilVeterinarioUpdate(BaseModel):
    nombre_clinica: Optional[str] = Field(None, min_length=2, max_length=150)
    matricula: Optional[str] = Field(None, min_length=3, max_length=50)
    especialidad: Optional[str] = None
    direccion_consultorio: Optional[str] = None
    telefono_agenda: Optional[str] = None
    activo: Optional[bool] = None


class PerfilVeterinarioResponse(PerfilVeterinarioCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    activo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthVeterinarioRegisterResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    perfil: PerfilVeterinarioResponse