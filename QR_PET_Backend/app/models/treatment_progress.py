"""
Modelo de Progreso de Tratamiento
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.medical_record import MedicalRecord
    from app.models.user import User


class TreatmentProgress(Base):
    """Seguimiento del progreso de un tratamiento"""
    __tablename__ = "treatment_progress"

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

    # Veterinario que registra el progreso
    veterinarian_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Fecha del reporte
    fecha_reporte: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Estado del tratamiento
    estado: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )
    # Estados: "iniciado", "en_progreso", "completado", "complicaciones"

    # Descripción del progreso
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Recomendaciones
    recomendaciones: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Foto o evidencia (URL a archivo)
    foto_evidencia: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Auditoría
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    # RELACIONES
    medical_record: Mapped["MedicalRecord"] = relationship(
        "MedicalRecord",
        back_populates="treatment_progress",
        foreign_keys=[medical_record_id]
    )

    veterinarian: Mapped["User"] = relationship(
        "User",
        back_populates="treatment_progress",
        foreign_keys=[veterinarian_id]
    )

    def __repr__(self) -> str:
        return f"<TreatmentProgress(record_id={self.medical_record_id}, estado={self.estado})>"
