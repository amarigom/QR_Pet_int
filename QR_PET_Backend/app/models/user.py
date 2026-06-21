# app/models/user.py
import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID  # Tipo específico para Postgres
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.core.constants import UserRole

# Esto evita el error de importación circular durante la ejecución
if TYPE_CHECKING:
    from app.models.pet import Pet
    from app.models.veterinary_clinic import VeterinaryClinic
    from app.models.medical_record import MedicalRecord
    from app.models.appointment import Appointment
    from app.models.treatment_progress import TreatmentProgress

class User(Base):
    __tablename__ = "usuarios"

    # Identificador único usando UUID nativo de PostgreSQL
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
        
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        nullable=False, 
        index=True
    )
    
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    
    telefono: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Usamos el Enum de tus constantes para el rol
    rol: Mapped[str] = mapped_column(
        String(20), 
        default=UserRole.USER
    )
    
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Campos específicos para veterinarios
    veterinary_clinic_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("veterinary_clinics.id"),
        nullable=True,
        index=True
    )
    
    # Especialidades (JSON array)
    especialidades: Mapped[Optional[list]] = mapped_column(nullable=True)
    
    # Licencia profesional
    licencia_profesional: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Fecha de creación gestionada por la base de datos
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now()
    )

    # RELACIÓN: Un usuario puede tener muchas mascotas
    # cascade="all, delete-orphan" significa que si borras al usuario, se borran sus mascotas
    pets: Mapped[List["Pet"]] = relationship(
        "Pet", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )
    
    # Nuevas relaciones para veterinarios
    veterinary_clinic: Mapped[Optional["VeterinaryClinic"]] = relationship(
        "VeterinaryClinic",
        back_populates="veterinarians",
        foreign_keys=[veterinary_clinic_id]
    )
    
    medical_records: Mapped[List["MedicalRecord"]] = relationship(
        "MedicalRecord",
        back_populates="veterinarian",
        foreign_keys="MedicalRecord.veterinarian_id"
    )
    
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment",
        back_populates="veterinarian",
        foreign_keys="Appointment.veterinarian_id"
    )
    
    treatment_progress: Mapped[List["TreatmentProgress"]] = relationship(
        "TreatmentProgress",
        back_populates="veterinarian",
        foreign_keys="TreatmentProgress.veterinarian_id"
    )

    def __repr__(self) -> str:
        return f"<User(email={self.email}, nombre={self.nombre}, rol={self.rol})>"
