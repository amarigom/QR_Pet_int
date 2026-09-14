import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models import Base

class HistoriaClinica(Base):
    __tablename__ = "historias_clinicas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Tenant / Discriminador
    veterinario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    mascota_id = Column(UUID(as_uuid=True), ForeignKey("mascotas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    fecha_consulta = Column(DateTime, default=datetime.utcnow, index=True)
    motivo_consulta = Column(String(255), nullable=False)
    diagnostico = Column(Text, nullable=True)
    tratamiento = Column(Text, nullable=True)
    peso_kg = Column(Float, nullable=True)
    temperatura_c = Column(Float, nullable=True)
    
    # Recetas, análisis y ecografías (URLs)
    adjuntos = Column(JSONB, default=list, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)