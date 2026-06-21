"""
Servicio para Registros de Vacunación
"""
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.vaccination_record_repository import VaccinationRecordRepository
from app.repositories.medical_record_repository import MedicalRecordRepository
from app.repositories.pet_repository import PetRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.schemas.vaccination_record import (
    VaccinationRecordCreate,
    VaccinationRecordUpdate,
    VaccinationRecordResponse,
)


class VaccinationService:
    """Servicio para gestionar vacunaciones"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.vaccine_repo = VaccinationRecordRepository(db)
        self.record_repo = MedicalRecordRepository(db)
        self.pet_repo = PetRepository(db)

    async def create_vaccination(
        self,
        medical_record_id: uuid.UUID,
        vaccine_data: VaccinationRecordCreate
    ) -> VaccinationRecordResponse:
        """Registra una nueva vacunación"""
        # Verificar que el registro médico existe
        medical_record = await self.record_repo.get_by_id(medical_record_id)
        if not medical_record:
            raise ResourceNotFoundException("Registro médico")

        # Validar que es un registro de vacunación
        if medical_record.tipo != "vacunación":
            raise ValidationException("El registro médico debe ser de tipo vacunación")

        # Crear registro de vacunación
        new_vaccine = await self.vaccine_repo.create(
            medical_record_id=medical_record_id,
            **vaccine_data.model_dump()
        )
        await self.db.commit()

        vaccine = await self.vaccine_repo.get_by_id(new_vaccine.id)
        if not vaccine:
            raise ResourceNotFoundException("Vacunación recién creada")

        return VaccinationRecordResponse.model_validate(vaccine)

    async def get_vaccination(self, vaccine_id: uuid.UUID) -> VaccinationRecordResponse:
        """Obtiene detalles de una vacunación"""
        vaccine = await self.vaccine_repo.get_by_id(vaccine_id)

        if not vaccine:
            raise ResourceNotFoundException("Vacunación")

        return VaccinationRecordResponse.model_validate(vaccine)

    async def get_pet_vaccinations(
        self,
        pet_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Obtiene todas las vacunaciones de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        vaccines = await self.vaccine_repo.get_by_pet_id(pet_id)

        return {
            "items": [VaccinationRecordResponse.model_validate(v) for v in vaccines],
            "total": len(vaccines),
            "pet_id": pet_id,
            "pet_name": pet.nombre,
        }

    async def get_vaccine_history(
        self,
        pet_id: uuid.UUID,
        nombre_vacuna: str
    ) -> List[VaccinationRecordResponse]:
        """Obtiene historial de una vacuna específica"""
        vaccines = await self.vaccine_repo.get_vaccines_by_name(pet_id, nombre_vacuna)

        return [VaccinationRecordResponse.model_validate(v) for v in vaccines]

    async def get_overdue_vaccines(
        self,
        pet_id: uuid.UUID
    ) -> List[VaccinationRecordResponse]:
        """Obtiene vacunas vencidas (próxima dosis pasada)"""
        vaccines = await self.vaccine_repo.get_overdue_vaccines(pet_id)

        return [VaccinationRecordResponse.model_validate(v) for v in vaccines]

    async def get_upcoming_vaccines(
        self,
        pet_id: uuid.UUID,
        days: int = 30
    ) -> List[VaccinationRecordResponse]:
        """Obtiene vacunas próximas a vencer"""
        vaccines = await self.vaccine_repo.get_upcoming_vaccines(pet_id, days)

        return [VaccinationRecordResponse.model_validate(v) for v in vaccines]

    async def get_last_vaccine(
        self,
        pet_id: uuid.UUID,
        nombre_vacuna: str
    ) -> Optional[VaccinationRecordResponse]:
        """Obtiene la última aplicación de una vacuna"""
        vaccine = await self.vaccine_repo.get_last_vaccine(pet_id, nombre_vacuna)

        return VaccinationRecordResponse.model_validate(vaccine) if vaccine else None

    async def update_vaccination(
        self,
        vaccine_id: uuid.UUID,
        vaccine_data: VaccinationRecordUpdate
    ) -> VaccinationRecordResponse:
        """Actualiza un registro de vacunación"""
        vaccine = await self.vaccine_repo.get_by_id(vaccine_id)

        if not vaccine:
            raise ResourceNotFoundException("Vacunación")

        update_dict = vaccine_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(vaccine, key, value)

        await self.db.commit()

        vaccine = await self.vaccine_repo.get_by_id(vaccine_id)
        return VaccinationRecordResponse.model_validate(vaccine)

    async def delete_vaccination(self, vaccine_id: uuid.UUID) -> bool:
        """Elimina un registro de vacunación"""
        vaccine = await self.vaccine_repo.get_by_id(vaccine_id)

        if not vaccine:
            raise ResourceNotFoundException("Vacunación")

        success = await self.vaccine_repo.delete(vaccine_id)
        await self.db.commit()
        return success

    async def get_vaccination_summary(self, pet_id: uuid.UUID) -> Dict[str, Any]:
        """Resumen de vacunaciones de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        all_vaccines = await self.vaccine_repo.get_by_pet_id(pet_id)
        upcoming = await self.vaccine_repo.get_upcoming_vaccines(pet_id, days=30)
        overdue = await self.vaccine_repo.get_overdue_vaccines(pet_id)

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "total_vacunaciones": len(all_vaccines),
            "proximas": len(upcoming),
            "vencidas": len(overdue),
            "proximas_a_vencer": [
                VaccinationRecordResponse.model_validate(v) for v in upcoming[:5]
            ],
            "vencidas_urgentes": [
                VaccinationRecordResponse.model_validate(v) for v in overdue[:5]
            ],
        }
