"""
Servicio para Progreso de Tratamientos
"""
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.treatment_progress_repository import TreatmentProgressRepository
from app.repositories.medical_record_repository import MedicalRecordRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.schemas.treatment_progress import (
    TreatmentProgressCreate,
    TreatmentProgressUpdate,
    TreatmentProgressResponse,
)
from app.core.constants import UserRole


class TreatmentService:
    """Servicio para gestionar el progreso de tratamientos"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.treatment_repo = TreatmentProgressRepository(db)
        self.record_repo = MedicalRecordRepository(db)
        self.pet_repo = PetRepository(db)
        self.user_repo = UserRepository(db)

    async def create_treatment_progress(
        self,
        medical_record_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
        progress_data: TreatmentProgressCreate
    ) -> TreatmentProgressResponse:
        """Registra progreso de un tratamiento"""
        # Verificar que el registro existe
        medical_record = await self.record_repo.get_by_id(medical_record_id)
        if not medical_record:
            raise ResourceNotFoundException("Registro médico")

        # Verificar que el veterinario existe
        vet = await self.user_repo.get_by_id(veterinarian_id)
        if not vet or vet.rol != UserRole.VETERINARIO:
            raise ResourceNotFoundException("Veterinario")

        # Crear reporte de progreso
        new_progress = await self.treatment_repo.create(
            medical_record_id=medical_record_id,
            veterinarian_id=veterinarian_id,
            **progress_data.model_dump()
        )
        await self.db.commit()

        progress = await self.treatment_repo.get_by_id(new_progress.id)
        if not progress:
            raise ResourceNotFoundException("Progreso recién creado")

        return TreatmentProgressResponse.model_validate(progress)

    async def get_treatment_progress(
        self,
        progress_id: uuid.UUID
    ) -> TreatmentProgressResponse:
        """Obtiene detalles de un reporte de progreso"""
        progress = await self.treatment_repo.get_by_id(progress_id)

        if not progress:
            raise ResourceNotFoundException("Progreso de tratamiento")

        return TreatmentProgressResponse.model_validate(progress)

    async def get_treatment_history(
        self,
        medical_record_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Obtiene todo el progreso de un tratamiento"""
        medical_record = await self.record_repo.get_by_id(medical_record_id)
        if not medical_record:
            raise ResourceNotFoundException("Registro médico")

        progress_records = await self.treatment_repo.get_by_medical_record(
            medical_record_id
        )

        return {
            "medical_record_id": medical_record_id,
            "items": [TreatmentProgressResponse.model_validate(p) for p in progress_records],
            "total_reportes": len(progress_records),
        }

    async def get_pet_treatment_progress(
        self,
        pet_id: uuid.UUID,
        estado: Optional[str] = None
    ) -> Dict[str, Any]:
        """Obtiene todo el progreso de tratamientos de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        progress_records = await self.treatment_repo.get_by_pet_id(pet_id, estado)

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "items": [TreatmentProgressResponse.model_validate(p) for p in progress_records],
            "total": len(progress_records),
        }

    async def get_in_progress_treatments(
        self,
        pet_id: uuid.UUID
    ) -> List[TreatmentProgressResponse]:
        """Obtiene tratamientos en progreso de una mascota"""
        progress_records = await self.treatment_repo.get_in_progress(pet_id)

        return [TreatmentProgressResponse.model_validate(p) for p in progress_records]

    async def get_veterinarian_reports(
        self,
        veterinarian_id: uuid.UUID,
        estado: Optional[str] = None
    ) -> List[TreatmentProgressResponse]:
        """Obtiene reportes de progreso creados por un veterinario"""
        reports = await self.treatment_repo.get_by_veterinarian(
            veterinarian_id,
            estado
        )

        return [TreatmentProgressResponse.model_validate(r) for r in reports]

    async def get_latest_progress(
        self,
        medical_record_id: uuid.UUID
    ) -> Optional[TreatmentProgressResponse]:
        """Obtiene el reporte más reciente de un tratamiento"""
        progress = await self.treatment_repo.get_latest_by_medical_record(
            medical_record_id
        )

        return TreatmentProgressResponse.model_validate(progress) if progress else None

    async def update_treatment_progress(
        self,
        progress_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
        progress_data: TreatmentProgressUpdate
    ) -> TreatmentProgressResponse:
        """Actualiza un reporte de progreso (solo quien lo creó)"""
        progress = await self.treatment_repo.get_by_id(progress_id)

        if not progress:
            raise ResourceNotFoundException("Progreso de tratamiento")

        if progress.veterinarian_id != veterinarian_id:
            raise ValidationException("No tienes permiso para actualizar este reporte")

        update_dict = progress_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(progress, key, value)

        await self.db.commit()

        progress = await self.treatment_repo.get_by_id(progress_id)
        return TreatmentProgressResponse.model_validate(progress)

    async def mark_treatment_completed(
        self,
        medical_record_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
        final_notes: Optional[str] = None
    ) -> TreatmentProgressResponse:
        """Marca un tratamiento como completado"""
        latest = await self.treatment_repo.get_latest_by_medical_record(
            medical_record_id
        )

        if not latest:
            raise ResourceNotFoundException("Tratamiento")

        if latest.veterinarian_id != veterinarian_id:
            raise ValidationException("No tienes permiso para completar este tratamiento")

        latest.estado = "completado"
        if final_notes:
            latest.descripcion = final_notes

        await self.db.commit()

        progress = await self.treatment_repo.get_by_id(latest.id)
        return TreatmentProgressResponse.model_validate(progress)

    async def get_treatment_summary(
        self,
        pet_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Resumen de tratamientos de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        in_progress = await self.treatment_repo.get_in_progress(pet_id)
        all_records = await self.record_repo.get_by_pet_id(pet_id, limit=1000)
        
        treatment_records = [r for r in all_records if r.tipo == "tratamiento"]

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "total_tratamientos": len(treatment_records),
            "en_progreso": len(in_progress),
            "tratamientos_activos": [
                TreatmentProgressResponse.model_validate(t) for t in in_progress
            ],
        }

    async def delete_treatment_progress(
        self,
        progress_id: uuid.UUID,
        veterinarian_id: uuid.UUID
    ) -> bool:
        """Elimina un reporte de progreso"""
        progress = await self.treatment_repo.get_by_id(progress_id)

        if not progress:
            raise ResourceNotFoundException("Progreso de tratamiento")

        if progress.veterinarian_id != veterinarian_id:
            raise ValidationException("No tienes permiso para eliminar este reporte")

        success = await self.treatment_repo.delete(progress_id)
        await self.db.commit()
        return success
