# app/models/qr.py
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.pet import Pet


class QRType(str, Enum):
    FISICO = "FISICO"    # Medalla PetQR: rastreo GPS, mapa de escaneos y alertas
    CLINICO = "CLINICO"  # Credencial de laboratorio: acceso a estudios sin mapa


class QRCode(Base):
    __tablename__ = "codigos_qr"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # El código único (ej: QR-12345 para medalla física, CLN-12345 para credencial clínica)
    codigo: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )

    # Discriminador de uso: FISICO (medalla rastreable) vs CLINICO (solo estudios)
    tipo: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=QRType.FISICO.value,
        server_default=QRType.FISICO.value,
        index=True,
    )

    # Un QR puede estar impreso pero no tener mascota asignada aún
    mascota_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("mascotas.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Para saber si el QR está habilitado por el administrador
    activo: Mapped[bool] = mapped_column(
        Boolean, default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    lote: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, index=True
    )

    # RELACIÓN: Un QR pertenece a una mascota
    mascota: Mapped[Optional["Pet"]] = relationship("Pet")

    @property
    def is_clinical_only(self) -> bool:
        return self.tipo == QRType.CLINICO.value

    def __repr__(self) -> str:
        return f"<QRCode(codigo={self.codigo}, tipo={self.tipo}, activo={self.activo}, lote={self.lote})>"