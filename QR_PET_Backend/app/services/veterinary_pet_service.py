"""
Servicio Orquestador: Veterinary Pet Management
Usa Factory Pattern para evitar duplicados
"""
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.factories.pet_veterinary_link_factory import (
    PetVeterinaryLinkFactory,
    PetRegisteredEvent,
    PetLinkedToClinicEvent
)
from app.repositories.pet_repository import PetRepository
from app.core.exceptions import ValidationException, ResourceNotFoundException
from app.schemas.pet import PetCreate, PetDetailResponse
from app.schemas.user import UserCreate


class VeterinaryPetService:
    """
    Servicio orquestador para gestionar mascotas en contexto veterinario
    Usa Factory Pattern para evitar duplicados
    No depende circularmente de otros servicios
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.factory = PetVeterinaryLinkFactory(db)
        self.pet_repo = PetRepository(db)
        self.events: list = []  # Event queue para ser publicada a EventBus

    def get_events(self) -> list:
        """Obtiene eventos pendientes para publicar"""
        return self.events

    def clear_events(self) -> None:
        """Limpia la cola de eventos"""
        self.events = []

    async def register_pet_by_veterinarian(
        self,
        clinic_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
        pet_data: PetCreate,
        owner_data: UserCreate
    ) -> Dict[str, Any]:
        """
        Flujo 1: Veterinario carga mascota + dueño
        
        Casos:
        A. Dueño existe: Reusar | B. Dueño no existe: Crear
        Siempre crea MedicalRecord en la clínica
        """
        # Validar que el email del dueño sea válido
        if not owner_data.email:
            raise ValidationException("Email del dueño requerido")

        # Validar que no existe duplicado
        is_unique = await self.factory.validate_no_duplicates(
            pet_name=pet_data.nombre,
            owner_id=None,  # No lo sabemos aún
            clinic_id=clinic_id
        )
        # Nota: La validación de duplicados completa ocurre en Factory

        try:
            # Usar Factory para orquestar la carga
            pet, owner, medical_record = await self.factory.create_pet_by_veterinarian(
                clinic_id=clinic_id,
                veterinarian_id=veterinarian_id,
                pet_data=pet_data,
                owner_data=owner_data,
                owner_email=owner_data.email
            )

            # Registrar evento
            self.events.append(
                PetRegisteredEvent(pet.id, owner.id, clinic_id)
            )

            return {
                "success": True,
                "pet_id": pet.id,
                "pet_name": pet.nombre,
                "owner_id": owner.id,
                "owner_name": owner.nombre,
                "owner_email": owner.email,
                "clinic_id": clinic_id,
                "medical_record_id": medical_record.id,
                "message": "Mascota y propietario registrados exitosamente"
            }
        except Exception as e:
            await self.db.rollback()
            raise e

    async def register_pet_by_owner_scan(
        self,
        qr_codigo: str,
        pet_data: PetCreate,
        owner_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Flujo 2: Dueño escanea QR y carga mascota
        
        El sistema automáticamente vincula la mascota a la clínica del QR
        """
        try:
            pet, owner, medical_record = await self.factory.create_pet_by_owner_scan(
                qr_codigo=qr_codigo,
                pet_data=pet_data,
                owner_data=UserCreate(
                    email=owner.email,
                    nombre=owner.nombre,
                    telefono=getattr(owner, 'telefono', None)
                ),
                owner_id=owner_id
            )

            # Registrar eventos
            self.events.append(
                PetRegisteredEvent(pet.id, owner.id, medical_record.veterinary_clinic_id)
            )
            self.events.append(
                PetLinkedToClinicEvent(pet.id, medical_record.veterinary_clinic_id)
            )

            return {
                "success": True,
                "pet_id": pet.id,
                "pet_name": pet.nombre,
                "owner_id": owner.id,
                "clinic_id": medical_record.veterinary_clinic_id,
                "message": "Mascota registrada y vinculada a la clínica"
            }
        except Exception as e:
            await self.db.rollback()
            raise e

    async def link_pet_to_clinic(
        self,
        pet_id: uuid.UUID,
        clinic_id: uuid.UUID,
        veterinarian_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Flujo 3: Vincular mascota existente a clínica
        
        Ej: Mascota cargada por dueño, ahora se vincula a clínica
        """
        try:
            medical_record = await self.factory.link_existing_pet_to_clinic(
                pet_id=pet_id,
                clinic_id=clinic_id,
                veterinarian_id=veterinarian_id
            )

            pet = await self.pet_repo.get_by_id(pet_id)

            # Registrar evento
            self.events.append(
                PetLinkedToClinicEvent(pet_id, clinic_id)
            )

            return {
                "success": True,
                "pet_id": pet_id,
                "pet_name": pet.nombre,
                "clinic_id": clinic_id,
                "medical_record_id": medical_record.id,
                "message": "Mascota vinculada a la clínica exitosamente"
            }
        except Exception as e:
            await self.db.rollback()
            raise e

    async def get_pet_clinics(
        self,
        pet_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Obtiene todas las clínicas donde está registrada la mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Obtener todos los registros médicos
        from app.repositories.medical_record_repository import MedicalRecordRepository
        
        record_repo = MedicalRecordRepository(self.db)
        records = await record_repo.get_by_pet_id(pet_id)

        clinics = []
        seen_clinics = set()

        for record in records:
            if record.veterinary_clinic_id and record.veterinary_clinic_id not in seen_clinics:
                clinics.append({
                    "clinic_id": record.veterinary_clinic_id,
                    "first_registered": record.created_at
                })
                seen_clinics.add(record.veterinary_clinic_id)

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "clinics_count": len(clinics),
            "clinics": clinics
        }

    async def validate_pet_uniqueness(
        self,
        pet_name: str,
        owner_id: uuid.UUID,
        clinic_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Valida que no existe duplicado
        Útil para validación en formularios
        """
        is_unique = await self.factory.validate_no_duplicates(
            pet_name=pet_name,
            owner_id=owner_id,
            clinic_id=clinic_id
        )

        return {
            "is_unique": is_unique,
            "pet_name": pet_name,
            "owner_id": owner_id,
            "clinic_id": clinic_id,
            "message": "Mascota única" if is_unique else "Ya existe una mascota con este nombre en esta clínica"
        }
