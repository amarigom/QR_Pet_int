from datetime import datetime
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.pet import Pet
    from app.models.user import User


class ClinicalStudy(Base):
    __tablename__ = "estudios_clinicos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    mascota_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mascotas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Profesional / centro diagnóstico que realizó y cargó el estudio
    veterinario_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Ej: "Derivación Dr. Gómez" o "Particular"
    solicitado_por: Mapped[Optional[str]] = mapped_column(
        String(120),
        nullable=True,
    )

    titulo: Mapped[str] = mapped_column(String(150), nullable=False)        # Ej: "Radiografía de Tórax"
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)      # Ej: "Radiología", "Laboratorio"
    tipo_archivo: Mapped[str] = mapped_column(String(20), nullable=False)   # "PDF", "DICOM", "IMAGE"
    file_key: Mapped[str] = mapped_column(String(255), nullable=False)      # Ruta privada en R2 / S3
    tamano_bytes: Mapped[Optional[int]] = mapped_column(Integer)

    notas_veterinario: Mapped[Optional[str]] = mapped_column(Text)

    fecha_estudio: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
    )

    # Relaciones
    pet: Mapped["Pet"] = relationship("Pet", back_populates="clinical_studies")
    veterinario: Mapped[Optional["User"]] = relationship("User")