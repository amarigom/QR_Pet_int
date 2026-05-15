# app/models/scan.py
from sqlalchemy import String, DateTime, ForeignKey, Float, Text, func
from sqlalchemy.dialects.postgresql import UUID  # Importante para Neon/Postgres
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.qr import QRCode

class Scan(Base):
    __tablename__ = "escaneos"

    # Cambiado de String a UUID nativo para evitar el DatatypeMismatchError
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4  # Usamos el objeto UUID directamente, no el string
    )
    
    # Cambiado a UUID para que la Foreign Key coincida con codigos_qr.id
    qr_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("codigos_qr.id"), 
        nullable=False
    )
    
    # Ubicación
    latitud: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitud: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    direccion_aproximada: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Datos de quien encontró a la mascota
    mensaje_encontrador: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    telefono_encontrador: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now()
    )

    # Relación: Un escaneo pertenece a un QR
    qr: Mapped["QRCode"] = relationship("QRCode")

    def __repr__(self) -> str:
        return f"<Scan(qr_id={self.qr_id}, fecha={self.created_at})>"