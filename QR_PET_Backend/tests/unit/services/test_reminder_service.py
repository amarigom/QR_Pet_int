"""
Unit Tests para ReminderService

Prueba la creación y envío de recordatorios
"""

import pytest
import uuid
from datetime import datetime, timedelta

from app.services.reminder_service import ReminderService
from app.repositories.pet_repository import PetRepository
from app.models import Pet, User
from sqlalchemy.ext.asyncio import AsyncSession


class TestReminderService:
    """Tests para ReminderService"""
    
    @pytest.mark.asyncio
    async def test_create_reminder(
        self,
        test_db: AsyncSession,
        sample_pet_data,
        mock_email_provider,
    ):
        """Test: Crear recordatorio manualmente"""
        # Crear pet
        pet = Pet(**sample_pet_data, id=uuid.uuid4())
        test_db.add(pet)
        await test_db.commit()
        
        service = ReminderService(test_db, email_service=None)
        
        # Crear recordatorio
        reminder_data = {
            "pet_id": pet.id,
            "owner_email": "owner@example.com",
            "reminder_type": "vacunación_proxima",
            "asunto": "Vacuna Rabia",
            "contenido": "Tu mascota necesita vacunarse",
        }
        
        # TODO: Implementar crear_reminder en service
        # result = await service.create_reminder(**reminder_data)
        # assert result is not None
    
    @pytest.mark.asyncio
    async def test_send_pending_reminders(
        self,
        test_db: AsyncSession,
        mock_email_provider,
    ):
        """Test: Enviar recordatorios pendientes"""
        from app.services.email_service import EmailService
        
        email_service = EmailService(provider=mock_email_provider)
        service = ReminderService(test_db, email_service=email_service)
        
        # Enviar recordatorios pendientes
        result = await service.send_pending_reminders()
        
        assert "sent" in result
        assert "failed" in result
        assert result["sent"] >= 0
        assert result["failed"] >= 0
    
    @pytest.mark.asyncio
    async def test_get_statistics(
        self,
        test_db: AsyncSession,
    ):
        """Test: Obtener estadísticas de recordatorios"""
        service = ReminderService(test_db)
        
        stats = await service.get_statistics()
        
        assert "pending_count" in stats
        assert "sent_today" in stats
        assert "timestamp" in stats
        assert stats["pending_count"] >= 0
        assert stats["sent_today"] >= 0
