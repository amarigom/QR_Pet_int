# app/models/user.py
import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID  # Tipo específico para Postgres
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.core.constants import UserRole

# Esto evita el error de importación circular durante la ejecución
if TYPE_CHECKING:
    from app.models.pet import Pet

class User(Base):
    __tablename__ = "usuarios"

    # Identificador único usando UUID nativo de PostgreSQL
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
        
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True
    )
    
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    
    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Usamos el Enum de tus constantes para el rol
    rol: Mapped[str] = mapped_column(
        String(20), 
        default=UserRole.USER
    )
    
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Fecha de creación gestionada por la base de datos
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now()
    )

    # RELACIÓN: Un usuario puede tener muchas mascotas
    # cascade="all, delete-orphan" significa que si borras al usuario, se borran sus mascotas
    pets: Mapped[List["Pet"]] = relationship(
        "Pet", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(email={self.email}, nombre={self.nombre})>"