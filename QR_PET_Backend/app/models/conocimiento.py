from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.models.base import Base



class KnowledgeVector(Base):
    __tablename__ = "knowledge_vectors"

    # 'id' int autoincremental y 'created_at' vienen heredados de Base
    doc_id = Column(String, nullable=False, index=True)
    titulo = Column(String, nullable=False)
    contenido = Column(Text, nullable=False)
    categoria = Column(String, default="general", index=True)
    embedding = Column(Vector(3072), nullable=False)