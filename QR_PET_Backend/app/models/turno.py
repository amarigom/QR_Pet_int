import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models import Base

class Turno(Base):
    __tablename__ = "turnos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Tenant / Discriminador
    veterinario_id = Column(UUID(as_uuid=True), ForeignKey("usuarioss.id", ondelete="CASCADE"), nullable=False, index=True)
    mascota_id = Column(UUID(as_uuid=True), ForeignKey("mascotas.id", ondelete="CASCADE"), nullable=False, index=True)
    dueno_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    
    fecha_hora_inicio = Column(DateTime, nullable=False, index=True)
    fecha_hora_fin = Column(DateTime, nullable=False)
    
    estado = Column(String(30), default="PROGRAMADO", nullable=False)  # PROGRAMADO, ATENDIDO, CANCELADO
    tipo_servicio = Column(String(50), nullable=False)                 # Consulta, Vacunación, Cirugía
    observaciones = Column(Text, nullable=True)
    
    recordatorio_enviado = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)