"""
Unit Tests para MedicalRecordService

Prueba la creación y gestión de registros médicos
"""

import pytest
import uuid

from app.services.medical_record_service import MedicalRecordService
from app.models import Pet, User, MedicalRecord
from sqlalchemy.ext.asyncio import AsyncSession


class TestMedicalRecordService:
    """Tests para MedicalRecordService"""
    
    @pytest.mark.asyncio
    async def test_create_medical_record(
        self,
        test_db: AsyncSession,
        sample_pet_data,
        sample_medical_record_data,
    ):
        """Test: Crear registro médico"""
        # Crear pet
        pet = Pet(**sample_pet_data, id=uuid.uuid4())
        test_db.add(pet)
        await test_db.commit()
        
        # Crear usuario veterinario
        vet_id = uuid.uuid4()
        
        service = MedicalRecordService(test_db)
        
        # TODO: Implementar crear_record en service
        # record_data = {
        #     "pet_id": pet.id,
        #     "veterinarian_id": vet_id,
        #     "clinic_id": clinic_id,
        #     **sample_medical_record_data,
        # }
        # result = await service.create_medical_record(**record_data)
        # assert result is not None
        # assert result.pet_id == pet.id
    
    @pytest.mark.asyncio
    async def test_get_medical_history(
        self,
        test_db: AsyncSession,
        sample_pet_data,
    ):
        """Test: Obtener historial médico de mascota"""
        # Crear pet
        pet = Pet(**sample_pet_data, id=uuid.uuid4())
        test_db.add(pet)
        await test_db.commit()
        
        service = MedicalRecordService(test_db)
        
        # TODO: Implementar get_history en service
        # history = await service.get_medical_history(pet.id)
        # assert isinstance(history, list)
    
    @pytest.mark.asyncio
    async def test_update_treatment_progress(
        self,
        test_db: AsyncSession,
    ):
        """Test: Actualizar progreso de tratamiento"""
        service = MedicalRecordService(test_db)
        
        # TODO: Implementar update_progress en service
        # result = await service.update_progress(
        #     record_id=record_id,
        #     status="in_progress",
        #     notes="Pet responding well to treatment"
        # )
        # assert result is not None
