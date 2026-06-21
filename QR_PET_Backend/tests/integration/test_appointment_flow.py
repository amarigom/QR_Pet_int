"""
Integration Tests para Appointment Flow

Prueba flujos completos de citas veterinarias
"""

import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Pet, User, Appointment, VeterinaryClinic
from app.services.appointment_service import AppointmentService
from app.services.email_service import MockProvider, EmailService


class TestAppointmentFlow:
    """Tests para flujos de citas"""
    
    @pytest.mark.asyncio
    async def test_full_appointment_lifecycle(
        self,
        test_db: AsyncSession,
        sample_clinic_data,
        sample_veterinarian_data,
        sample_pet_data,
        sample_appointment_data,
        mock_email_provider,
    ):
        """Test: Flujo completo de cita (crear → confirmar → completar)"""
        
        # Crear clínica
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        
        # Crear veterinario
        vet = User(
            **sample_veterinarian_data,
            id=uuid.uuid4(),
            veterinary_clinic_id=clinic.id,
        )
        test_db.add(vet)
        
        # Crear dueño
        owner = User(
            email="owner@example.com",
            nombre="Owner Name",
            id=uuid.uuid4(),
            password_hash="hashed",
            rol="usuario",
        )
        test_db.add(owner)
        
        # Crear mascota
        pet = Pet(
            **sample_pet_data,
            id=uuid.uuid4(),
            owner_id=owner.id,
        )
        test_db.add(pet)
        await test_db.commit()
        
        # Crear servicio de citas
        email_service = EmailService(provider=mock_email_provider)
        service = AppointmentService(test_db, email_service=email_service)
        
        # TODO: Crear cita
        # appointment = await service.create_appointment(
        #     pet_id=pet.id,
        #     veterinarian_id=vet.id,
        #     clinic_id=clinic.id,
        #     fecha_hora=datetime.utcnow() + timedelta(days=7),
        #     tipo_consulta="Consulta General",
        # )
        # assert appointment is not None
        # assert appointment.estado == "pending"
        
        # TODO: Confirmar cita
        # confirmed = await service.confirm_appointment(appointment.id)
        # assert confirmed.estado == "confirmed"
        
        # TODO: Completar cita
        # completed = await service.complete_appointment(appointment.id)
        # assert completed.estado == "completed"
    
    @pytest.mark.asyncio
    async def test_appointment_with_reminder(
        self,
        test_db: AsyncSession,
        sample_clinic_data,
        sample_veterinarian_data,
        sample_pet_data,
        mock_email_provider,
    ):
        """Test: Crear cita y enviar recordatorio automático"""
        
        # Setup
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        
        vet = User(
            **sample_veterinarian_data,
            id=uuid.uuid4(),
            veterinary_clinic_id=clinic.id,
        )
        test_db.add(vet)
        
        owner = User(
            email="owner@example.com",
            nombre="Owner",
            id=uuid.uuid4(),
            password_hash="hashed",
            rol="usuario",
        )
        test_db.add(owner)
        
        pet = Pet(
            **sample_pet_data,
            id=uuid.uuid4(),
            owner_id=owner.id,
        )
        test_db.add(pet)
        await test_db.commit()
        
        # Crear email service
        email_service = EmailService(provider=mock_email_provider)
        
        # TODO: Crear cita y verificar que se envía recordatorio
        # appointment_service = AppointmentService(test_db, email_service=email_service)
        # reminder_service = ReminderService(test_db, email_service=email_service)
        
        # appointment = await appointment_service.create_appointment(
        #     pet_id=pet.id,
        #     veterinarian_id=vet.id,
        #     clinic_id=clinic.id,
        #     fecha_hora=datetime.utcnow() + timedelta(days=1),
        #     tipo_consulta="Consulta General",
        # )
        
        # # El recordatorio debe estar creado
        # reminders = await reminder_service.get_by_appointment(appointment.id)
        # assert len(reminders) > 0
    
    @pytest.mark.asyncio
    async def test_cancel_appointment_with_notification(
        self,
        test_db: AsyncSession,
        sample_clinic_data,
        sample_veterinarian_data,
        sample_pet_data,
        mock_email_provider,
    ):
        """Test: Cancelar cita y notificar al dueño"""
        
        # Setup similar al anterior
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        
        vet = User(
            **sample_veterinarian_data,
            id=uuid.uuid4(),
            veterinary_clinic_id=clinic.id,
        )
        test_db.add(vet)
        
        owner = User(
            email="owner@example.com",
            nombre="Owner",
            id=uuid.uuid4(),
            password_hash="hashed",
            rol="usuario",
        )
        test_db.add(owner)
        
        pet = Pet(
            **sample_pet_data,
            id=uuid.uuid4(),
            owner_id=owner.id,
        )
        test_db.add(pet)
        await test_db.commit()
        
        # TODO: Crear cita y luego cancelarla
        # email_service = EmailService(provider=mock_email_provider)
        # service = AppointmentService(test_db, email_service=email_service)
        
        # appointment = await service.create_appointment(...)
        # cancelled = await service.cancel_appointment(appointment.id, reason="Veterinarian busy")
        # assert cancelled.estado == "canceled"
        # assert cancelled.notas == "Veterinarian busy"
