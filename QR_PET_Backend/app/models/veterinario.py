# app/models/veterinario.py
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class PerfilVeterinario(Base):
    __tablename__ = "perfiles_veterinarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("usuarios.id", ondelete="CASCADE"), 
        nullable=False, 
        unique=True, 
        index=True
    )
    
    nombre_clinica: Mapped[str] = mapped_column(String(150), nullable=False)
    matricula: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    especialidad: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    direccion_consultorio: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telefono_agenda: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now()
    )

    # Relación inversa apuntando a "User" en string (SQLAlchemy lo resuelve post-inspección sin romper)
    usuario: Mapped["User"] = relationship(
        "User", 
        back_populates="perfil_veterinario"
    )

    def __repr__(self) -> str:
        return f"<PerfilVeterinario(matricula={self.matricula}, clinica={self.nombre_clinica})>"