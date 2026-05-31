# app/models/qr.py
from sqlalchemy import String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from typing import Optional, TYPE_CHECKING

# Evitamos importación circular para el tipado
if TYPE_CHECKING:
    from app.models.pet import Pet

class QRCode(Base):
    __tablename__ = "codigos_qr"
    
    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # El código único que se imprime en la placa (ej: QR-12345)
    codigo: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    
    # Un QR puede estar impreso pero no tener mascota asignada aún
    mascota_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("mascotas.id", ondelete="SET NULL"), nullable=True
    )
    
    # Para saber si el QR está habilitado por el administrador
    activo: Mapped[bool] = mapped_column(
        Boolean, default=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()  # Ahora sí va a funcionar sin errores
    )
    
    lote: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, index=True
    )
    
    # RELACIÓN: Un QR pertenece a una mascota
    mascota: Mapped[Optional["Pet"]] = relationship(
        "Pet", 
        back_populates="qr_code"
    )

    def __repr__(self) -> str:
        return f"<QRCode(codigo={self.codigo}, activo={self.activo}, lote={self.lote})>"