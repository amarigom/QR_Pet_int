"""
Integration Tests para Pet Registration Flow

Prueba flujos completos de registro de mascotas
"""

import pytest
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Pet, User, VeterinaryClinic
from app.factories.pet_veterinary_link_factory import PetVeterinaryLinkFactory
from app.core.constants import UserRole


class TestPetRegistrationFlow:
    """Tests para flujos de registro de mascotas"""
    
    @pytest.mark.asyncio
    async def test_vet_registers_pet_with_new_owner(
        self,
        test_db: AsyncSession,
        sample_veterinarian_data,
        sample_clinic_data,
        sample_pet_data,
    ):
        """Test: Veterinario registra mascota con dueño nuevo"""
        
        # Crear clínica
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        await test_db.commit()
        
        # Crear veterinario
        vet = User(
            **sample_veterinarian_data,
            id=uuid.uuid4(),
            rol=UserRole.VETERINARIO,
            veterinary_clinic_id=clinic.id,
        )
        test_db.add(vet)
        await test_db.commit()
        
        # Datos de dueño nuevo
        owner_data = {
            "email": "newowner@example.com",
            "nombre": "Juan Pérez",
            "telefono": "1111111111",
            "rol": UserRole.USER,
        }
        
        # Usar factory para registrar mascota
        factory = PetVeterinaryLinkFactory(test_db)
        
        pet_data = {
            **sample_pet_data,
            "owner_email": owner_data["email"],
        }
        
        # TODO: Implementar factory method
        # pet, owner = await factory.load_pet_by_vet(
        #     vet_id=vet.id,
        #     pet_data=pet_data,
        #     owner_data=owner_data,
        #     clinic_id=clinic.id
        # )
        
        # assert pet is not None
        # assert pet.owner_id is not None
        # assert owner.email == owner_data["email"]
    
    @pytest.mark.asyncio
    async def test_vet_registers_pet_with_existing_owner(
        self,
        test_db: AsyncSession,
        sample_veterinarian_data,
        sample_clinic_data,
        sample_pet_data,
    ):
        """Test: Veterinario registra mascota con dueño existente"""
        
        # Crear clínica
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        
        # Crear dueño existente
        owner = User(
            email="existing@example.com",
            nombre="Pedro García",
            rol=UserRole.USER,
            id=uuid.uuid4(),
            password_hash="hashed",
        )
        test_db.add(owner)
        await test_db.commit()
        
        # Crear veterinario
        vet = User(
            **sample_veterinarian_data,
            id=uuid.uuid4(),
            rol=UserRole.VETERINARIO,
            veterinary_clinic_id=clinic.id,
        )
        test_db.add(vet)
        await test_db.commit()
        
        # Usar factory para registrar mascota con dueño existente
        factory = PetVeterinaryLinkFactory(test_db)
        
        pet_data = {
            **sample_pet_data,
            "owner_id": owner.id,
        }
        
        # TODO: Implementar factory method
        # pet = await factory.link_existing_pet_to_owner(
        #     pet_data=pet_data,
        #     owner_id=owner.id,
        #     clinic_id=clinic.id
        # )
        
        # assert pet is not None
        # assert pet.owner_id == owner.id
    
    @pytest.mark.asyncio
    async def test_owner_scans_qr_registers_pet(
        self,
        test_db: AsyncSession,
        sample_clinic_data,
        sample_pet_data,
    ):
        """Test: Dueño escanea QR y registra mascota"""
        
        # Crear clínica
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        
        # Crear dueño
        owner = User(
            email="owner@example.com",
            nombre="María López",
            rol=UserRole.USER,
            id=uuid.uuid4(),
            password_hash="hashed",
        )
        test_db.add(owner)
        await test_db.commit()
        
        # Usar factory para registro por escaneo QR
        factory = PetVeterinaryLinkFactory(test_db)
        
        pet_data = {
            **sample_pet_data,
            "owner_id": owner.id,
        }
        
        # TODO: Implementar factory method
        # pet, clinic_linked = await factory.load_pet_by_owner_qr_scan(
        #     pet_data=pet_data,
        #     owner_id=owner.id,
        #     qr_code_token="VALID_QR_TOKEN"
        # )
        
        # assert pet is not None
        # assert clinic_linked is not None
