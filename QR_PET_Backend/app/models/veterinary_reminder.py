"""
Modelo de Recordatorio Veterinario
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.pet import Pet


class VeterinaryReminder(Base):
    """Recordatorio automático para veterinario y dueño"""
    __tablename__ = "veterinary_reminders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Referencia a la mascota
    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # Tipo de recordatorio
    tipo: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    # Tipos: "vacunación_proxima", "estudio_pendiente", "turno_recordatorio", "tratamiento_seguimiento"

    # Destinatarios
    owner_email: Mapped[str] = mapped_column(String(255), nullable=False)

    veterinary_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Fecha programada para enviar
    fecha_programada: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True
    )

    # Fecha de envío real (NULL si no se envió)
    fecha_enviado: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Contenido del recordatorio
    asunto: Mapped[str] = mapped_column(String(255), nullable=False)

    contenido: Mapped[str] = mapped_column(Text, nullable=False)

    # Estado
    enviado: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    intentos_envio: Mapped[int] = mapped_column(default=0)

    # Error (si no se pudo enviar)
    error_mensaje: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Auditoría
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    # RELACIONES
    pet: Mapped["Pet"] = relationship(
        "Pet",
        back_populates="veterinary_reminders",
        foreign_keys=[pet_id]
    )

    def __repr__(self) -> str:
        return f"<VeterinaryReminder(pet_id={self.pet_id}, tipo={self.tipo}, enviado={self.enviado})>"
