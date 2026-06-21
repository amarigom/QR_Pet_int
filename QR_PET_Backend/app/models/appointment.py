"""
Modelo de Turno/Cita Veterinaria
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.pet import Pet
    from app.models.user import User
    from app.models.veterinary_clinic import VeterinaryClinic


class Appointment(Base):
    """Turno/cita veterinaria"""
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Referencias
    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    veterinary_clinic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    veterinarian_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    # Tipo de consulta
    tipo_consulta: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    # Ej: "vacunación", "chequeo general", "cirugía", "estudio", etc

    # Fechas
    fecha_programada: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True
    )

    # Estado del turno
    estado: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pendiente",
        index=True
    )
    # Estados: "pendiente", "confirmado", "completado", "cancelado"

    # Notas previas (instrucciones para el dueño)
    notas_previas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Notas posteriores (resultado de la consulta)
    notas_posteriores: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Duración estimada en minutos
    duracion_estimada: Mapped[Optional[int]] = mapped_column(nullable=True)

    # Auditoría
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    # RELACIONES
    pet: Mapped["Pet"] = relationship(
        "Pet",
        back_populates="appointments",
        foreign_keys=[pet_id]
    )

    veterinary_clinic: Mapped["VeterinaryClinic"] = relationship(
        "VeterinaryClinic",
        back_populates="appointments",
        foreign_keys=[veterinary_clinic_id]
    )

    veterinarian: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="appointments",
        foreign_keys=[veterinarian_id]
    )

    def __repr__(self) -> str:
        return f"<Appointment(pet_id={self.pet_id}, tipo={self.tipo_consulta}, fecha={self.fecha_programada})>"
