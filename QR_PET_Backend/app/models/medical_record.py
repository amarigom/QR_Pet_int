"""
Modelo de Registro Médico (Historial Clínico)
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List

from sqlalchemy import String, DateTime, func, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.pet import Pet
    from app.models.user import User
    from app.models.veterinary_clinic import VeterinaryClinic
    from app.models.vaccination_record import VaccinationRecord
    from app.models.treatment_progress import TreatmentProgress


class MedicalRecord(Base):
    """Registro médico/historial clínico de una mascota"""
    __tablename__ = "medical_records"

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

    veterinarian_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    veterinary_clinic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )

    # Tipo de registro
    tipo: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    # Valores posibles: "consulta", "vacunación", "cirugía", "estudio", etc

    # Información del registro
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    diagnostico: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    tratamiento: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Medicamentos como JSON array
    medicamentos: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Ej: {"medicamentos": [{"nombre": "Amoxicilina", "dosis": "500mg", "frecuencia": "cada 8hs"}]}

    # Archivo adjunto (URL)
    archivo_adjunto: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Fecha de la consulta/registro
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

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
        back_populates="medical_records",
        foreign_keys=[pet_id]
    )

    veterinarian: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="medical_records",
        foreign_keys=[veterinarian_id]
    )

    veterinary_clinic: Mapped[Optional["VeterinaryClinic"]] = relationship(
        "VeterinaryClinic",
        back_populates="medical_records",
        foreign_keys=[veterinary_clinic_id]
    )

    # Composite relations
    vaccination_records: Mapped[List["VaccinationRecord"]] = relationship(
        "VaccinationRecord",
        back_populates="medical_record",
        cascade="all, delete-orphan"
    )

    treatment_progress: Mapped[List["TreatmentProgress"]] = relationship(
        "TreatmentProgress",
        back_populates="medical_record",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<MedicalRecord(pet_id={self.pet_id}, tipo={self.tipo}, fecha={self.fecha_registro})>"
