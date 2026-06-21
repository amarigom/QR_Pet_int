"""
Modelo de Registro de Vacunación
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.medical_record import MedicalRecord


class VaccinationRecord(Base):
    """Registro de vacunación específico"""
    __tablename__ = "vaccination_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Referencia al registro médico
    medical_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Datos de la vacuna
    nombre_vacuna: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    lote: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Fechas
    fecha_aplicacion: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True
    )

    proxima_dosis: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        index=True
    )

    # Notas adicionales
    observaciones: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Auditoría
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    # RELACIONES
    medical_record: Mapped["MedicalRecord"] = relationship(
        "MedicalRecord",
        back_populates="vaccination_records",
        foreign_keys=[medical_record_id]
    )

    def __repr__(self) -> str:
        return f"<VaccinationRecord(nombre={self.nombre_vacuna}, fecha={self.fecha_aplicacion})>"
