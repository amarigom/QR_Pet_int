"""
Integration Tests para Email Notifications

Prueba el envío de emails en flujos completos
"""

import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Pet, User, VeterinaryClinic, VeterinaryReminder
from app.services.reminder_service import ReminderService
from app.services.email_service import EmailService, MockProvider
from app.repositories.veterinary_reminder_repository import VeterinaryReminderRepository


class TestEmailNotifications:
    """Tests para notificaciones por email"""
    
    @pytest.mark.asyncio
    async def test_vaccine_reminder_email_sent(
        self,
        test_db: AsyncSession,
        sample_clinic_data,
        sample_pet_data,
        mock_email_provider,
    ):
        """Test: Email de recordatorio de vacuna enviado"""
        
        # Setup
        clinic = VeterinaryClinic(**sample_clinic_data, id=uuid.uuid4())
        test_db.add(clinic)
        
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
        
        # Crear servicio de email y recordatorios
        email_service = EmailService(provider=mock_email_provider)
        reminder_service = ReminderService(test_db, email_service=email_service)
        
        # Enviar recordatorio de vacuna
        success = await email_service.send_reminder_vaccine(
            to=owner.email,
            pet_name=pet.nombre,
            vaccine_name="Rabia",
            due_date="2024-08-21",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_appointment_confirmation_email_sent(
        self,
        test_db: AsyncSession,
        sample_clinic_data,
        sample_pet_data,
        mock_email_provider,
    ):
        """Test: Email de confirmación de cita enviado"""
        
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
        
        # Enviar email de confirmación
        success = await email_service.send_appointment_reminder(
            to=owner.email,
            pet_name=pet.nombre,
            appointment_date="2024-08-21",
            appointment_time="10:30",
            clinic_name="Clínica Feliz",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_medical_record_notification_email(
        self,
        test_db: AsyncSession,
        sample_pet_data,
        mock_email_provider,
    ):
        """Test: Notificación de nuevo registro médico enviado"""
        
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
        
        # Enviar notificación
        success = await email_service.send_medical_record_notification(
            to=owner.email,
            pet_name=pet.nombre,
            record_type="Consulta General",
            summary="Mascota en buen estado. Sin cambios.",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_batch_reminder_emails_sent(
        self,
        test_db: AsyncSession,
        mock_email_provider,
    ):
        """Test: Batch de emails de recordatorios enviados"""
        
        # Crear múltiples usuarios y mascotas
        owners = []
        for i in range(3):
            owner = User(
                email=f"owner{i}@example.com",
                nombre=f"Owner {i}",
                id=uuid.uuid4(),
                password_hash="hashed",
                rol="usuario",
            )
            test_db.add(owner)
            owners.append(owner)
        await test_db.commit()
        
        # Crear email service
        email_service = EmailService(provider=mock_email_provider)
        reminder_service = ReminderService(test_db, email_service=email_service)
        
        # Enviar recordatorios en batch
        sent_count = 0
        for owner in owners:
            success = await email_service.send_reminder_vaccine(
                to=owner.email,
                pet_name=f"Pet of {owner.nombre}",
                vaccine_name="Rabia",
                due_date="2024-08-21",
            )
            if success:
                sent_count += 1
        
        assert sent_count == 3
