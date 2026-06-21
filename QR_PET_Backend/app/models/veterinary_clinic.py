"""
Modelo de Clínica Veterinaria
"""
import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.medical_record import MedicalRecord
    from app.models.appointment import Appointment


class VeterinaryClinic(Base):
    """Modelo de clínica veterinaria"""
    __tablename__ = "veterinary_clinics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    nombre: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    direccion: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Ubicación GPS
    latitud: Mapped[Optional[Float]] = mapped_column(Float, nullable=True)
    longitud: Mapped[Optional[Float]] = mapped_column(Float, nullable=True)

    # Información adicional
    sitio_web: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Admin que creó/administra la clínica
    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Datos de auditoría
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
    # Una clínica tiene muchos veterinarios
    veterinarians: Mapped[List["User"]] = relationship(
        "User",
        back_populates="veterinary_clinic",
        foreign_keys="User.veterinary_clinic_id",
        cascade="all, delete-orphan"
    )

    # Una clínica tiene muchos registros médicos (a través de mascotas)
    medical_records: Mapped[List["MedicalRecord"]] = relationship(
        "MedicalRecord",
        back_populates="veterinary_clinic",
        cascade="all, delete-orphan"
    )

    # Una clínica tiene muchos turnos
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment",
        back_populates="veterinary_clinic",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<VeterinaryClinic(nombre={self.nombre}, email={self.email})>"
