from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.models.base import Base


class KnowledgeVector(Base):
    __tablename__ = "knowledge_vectors"

    doc_id = Column(String, nullable=False, index=True)
    chunk_id = Column(String, nullable=False, index=True)
    titulo = Column(String, nullable=False)
    contenido = Column(Text, nullable=False)
    categoria = Column(String, default="general", index=True)
    embedding = Column(Vector(3072), nullable=False)
    owner_type = Column(String(30), nullable=False, default="admin", server_default="admin", index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=True, index=True)
    pet_id = Column(UUID(as_uuid=True), ForeignKey("mascotas.id", ondelete="CASCADE"), nullable=True, index=True)
    source_type = Column(String(30), nullable=False, default="document", server_default="document")