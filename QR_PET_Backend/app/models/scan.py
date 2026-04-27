# app/models/scan.py
from sqlalchemy import String, DateTime, ForeignKey, Float, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.qr import QRCode

class Scan(Base):
    __tablename__ = "escaneos"

    id: Mapped[str] = mapped_column(
        String, 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    qr_id: Mapped[str] = mapped_column(
        String, 
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