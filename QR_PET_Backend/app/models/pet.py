# app/models/pet.py
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.core.constants import PetStatus, AnimalSpecies
from datetime import datetime
from typing import Optional, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.qr import QRCode

class Pet(Base):
    __tablename__ = "mascotas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("usuarios.id"), 
        nullable=False
    )
    
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # CORRECCIÓN AQUÍ: Forzamos el uso de los valores del Enum (minúsculas)
    especie: Mapped[AnimalSpecies] = mapped_column(
        Enum(
            AnimalSpecies, 
            name="animalspecies", 
            native_enum=True,
            values_callable=lambda x: [e.value for e in x]
        ), 
        nullable=False
    )
    
    raza: Mapped[Optional[str]] = mapped_column(String(100))
    color: Mapped[Optional[str]] = mapped_column(String(100))
    edad_aproximada: Mapped[Optional[str]] = mapped_column(String(100))
    foto_url: Mapped[Optional[str]] = mapped_column(String(255))
    
    notas: Mapped[Optional[str]] = mapped_column(Text)
    
    # CORRECCIÓN AQUÍ: Aplicamos lo mismo para el estado
    estado: Mapped[PetStatus] = mapped_column(
        Enum(
            PetStatus, 
            name="petstatus", 
            native_enum=True,
            values_callable=lambda x: [e.value for e in x]
        ), 
        default=PetStatus.ACTIVO
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )
    
    owner: Mapped["User"] = relationship("User", back_populates="pets")
    qr_code: Mapped[Optional["QRCode"]] = relationship("QRCode", back_populates="mascota", uselist=False, lazy="joined")
    

    def __repr__(self) -> str:
        return f"<Pet(nombre={self.nombre}, especie={self.especie}, estado={self.estado})>"