"""
Servicio para Registros Médicos
"""
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.medical_record_repository import MedicalRecordRepository
from app.repositories.vaccination_record_repository import VaccinationRecordRepository
from app.repositories.treatment_progress_repository import TreatmentProgressRepository
from app.repositories.pet_repository import PetRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
    MedicalRecordResponse,
)
from app.core.constants import UserRole


class MedicalRecordService:
    """Servicio para gestionar registros médicos"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.record_repo = MedicalRecordRepository(db)
        self.vaccine_repo = VaccinationRecordRepository(db)
        self.treatment_repo = TreatmentProgressRepository(db)
        self.pet_repo = PetRepository(db)

    async def create_medical_record(
        self,
        veterinarian_id: uuid.UUID,
        pet_id: uuid.UUID,
        clinic_id: uuid.UUID,
        record_data: MedicalRecordCreate
    ) -> MedicalRecordResponse:
        """
        Crea un nuevo registro médico
        Solo veterinarios pueden crear registros
        """
        # Verificar que la mascota existe
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Crear registro
        new_record = await self.record_repo.create(
            pet_id=pet_id,
            veterinarian_id=veterinarian_id,
            veterinary_clinic_id=clinic_id,
            **record_data.model_dump()
        )
        await self.db.commit()

        record = await self.record_repo.get_by_id(new_record.id)
        if not record:
            raise ResourceNotFoundException("Registro recién creado")

        return MedicalRecordResponse.model_validate(record)

    async def get_medical_record(self, record_id: uuid.UUID) -> MedicalRecordResponse:
        """Obtiene detalles de un registro médico"""
        record = await self.record_repo.get_by_id(record_id)

        if not record:
            raise ResourceNotFoundException("Registro médico")

        return MedicalRecordResponse.model_validate(record)

    async def get_pet_medical_history(
        self,
        pet_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene historial clínico completo de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        records = await self.record_repo.get_by_pet_id(pet_id, limit, offset)
        total = await self.record_repo.count_by_pet(pet_id)

        return {
            "items": [MedicalRecordResponse.model_validate(r) for r in records],
            "total": total,
            "pet_id": pet_id,
            "pet_name": pet.nombre,
        }

    async def get_records_by_type(
        self,
        pet_id: uuid.UUID,
        tipo: str
    ) -> List[MedicalRecordResponse]:
        """Obtiene registros de un tipo específico"""
        records = await self.record_repo.get_by_type(pet_id, tipo)

        return [MedicalRecordResponse.model_validate(r) for r in records]

    async def get_recent_records(
        self,
        pet_id: uuid.UUID,
        days: int = 30
    ) -> List[MedicalRecordResponse]:
        """Obtiene registros recientes de una mascota"""
        records = await self.record_repo.get_recent_for_pet(pet_id, days)

        return [MedicalRecordResponse.model_validate(r) for r in records]

    async def update_medical_record(
        self,
        record_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
        record_data: MedicalRecordUpdate
    ) -> MedicalRecordResponse:
        """Actualiza un registro médico (solo quien lo creó)"""
        record = await self.record_repo.get_by_id(record_id)

        if not record:
            raise ResourceNotFoundException("Registro médico")

        if record.veterinarian_id != veterinarian_id:
            raise ValidationException("No tienes permiso para actualizar este registro")

        update_dict = record_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(record, key, value)

        await self.db.commit()

        record = await self.record_repo.get_by_id(record_id)
        return MedicalRecordResponse.model_validate(record)

    async def get_clinic_records(
        self,
        clinic_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene todos los registros de una clínica"""
        records = await self.record_repo.get_by_clinic(clinic_id, limit, offset)
        total = await self.record_repo.count_by_clinic(clinic_id)

        return {
            "items": [MedicalRecordResponse.model_validate(r) for r in records],
            "total": total,
            "clinic_id": clinic_id,
        }

    async def get_medical_history_composite(
        self,
        pet_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Obtiene historial médico completo en formato composite
        Incluye: consultas, vacunaciones, tratamientos, próximas citas
        """
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Obtener registros
        all_records = await self.record_repo.get_by_pet_id(pet_id, limit=1000)

        # Separar por tipo
        consultas = [r for r in all_records if r.tipo == "consulta"]
        vacunaciones = [r for r in all_records if r.tipo == "vacunación"]
        tratamientos = [r for r in all_records if r.tipo == "tratamiento"]

        # Obtener vacunas próximas
        upcoming_vaccines = await self.vaccine_repo.get_upcoming_vaccines(pet_id, days=30)

        # Obtener tratamientos en progreso
        in_progress = await self.treatment_repo.get_in_progress(pet_id)

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "consultas_total": len(consultas),
            "vacunaciones_total": len(vacunaciones),
            "tratamientos_total": len(tratamientos),
            "consultas_recientes": [MedicalRecordResponse.model_validate(c) for c in consultas[:5]],
            "vacunaciones_recientes": [MedicalRecordResponse.model_validate(v) for v in vacunaciones[:5]],
            "vaccinas_proximas": len(upcoming_vaccines),
            "tratamientos_en_progreso": len(in_progress),
            "ultima_consulta": consultas[0].fecha_registro if consultas else None,
        }

    async def delete_medical_record(
        self,
        record_id: uuid.UUID,
        veterinarian_id: uuid.UUID
    ) -> bool:
        """Elimina un registro médico (solo quien lo creó)"""
        record = await self.record_repo.get_by_id(record_id)

        if not record:
            raise ResourceNotFoundException("Registro médico")

        if record.veterinarian_id != veterinarian_id:
            raise ValidationException("No tienes permiso para eliminar este registro")

        success = await self.record_repo.delete(record_id)
        await self.db.commit()
        return success
