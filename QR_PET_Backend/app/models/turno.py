# app/models/turno.py
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base  # Importación limpia consistente

class EstadoTurno(str, enum.Enum):
    PROGRAMADO = "PROGRAMADO"
    ATENDIDO = "ATENDIDO"
    CANCELADO = "CANCELADO"

class Turno(Base):
    __tablename__ = "turnos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 👈 Corregido el typo "usuarioss.id" -> "usuarios.id"
    veterinario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    mascota_id = Column(UUID(as_uuid=True), ForeignKey("mascotas.id", ondelete="CASCADE"), nullable=False, index=True)
    dueno_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=True, index=True)
    
    fecha_hora_inicio = Column(DateTime, nullable=False, index=True)
    fecha_hora_fin = Column(DateTime, nullable=False)
    
    estado = Column(SQLEnum(EstadoTurno), default=EstadoTurno.PROGRAMADO, nullable=False)
    tipo_servicio = Column(String(50), nullable=False)  # Consulta, Vacunación, Cirugía
    observaciones = Column(Text, nullable=True)
    
    recordatorio_enviado = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)