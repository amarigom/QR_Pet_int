import uuid
from typing import Optional, Dict, Any
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector

from app.core.database import Base

class PetVector(Base):
    __tablename__ = "pet_vectors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"), unique=True, nullable=False)
    
        # En app/models/pet_vector.py
    embedding: Mapped[Any] = mapped_column(Vector(3072), nullable=False)
    
    document: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSONB, nullable=True)

    # Relación opcional con la entidad Pet
    # pet = relationship("Pet", back_populates="vector")