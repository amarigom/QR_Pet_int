"""
Unit Tests para EmailService

Prueba el envío de emails con diferentes proveedores
"""

import pytest
from app.services.email_service import EmailService, MockProvider


class TestEmailService:
    """Tests para EmailService"""
    
    @pytest.mark.asyncio
    async def test_send_email_with_mock_provider(self, mock_email_provider):
        """Test: Enviar email con MockProvider"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_email_with_retry(
            to="test@example.com",
            subject="Test Subject",
            html_body="<p>Test Body</p>",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_send_reminder_vaccine(self, mock_email_provider):
        """Test: Enviar recordatorio de vacuna"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_reminder_vaccine(
            to="owner@example.com",
            pet_name="Max",
            vaccine_name="Rabia",
            due_date="2024-07-21",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_send_appointment_reminder(self, mock_email_provider):
        """Test: Enviar recordatorio de cita"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_appointment_reminder(
            to="owner@example.com",
            pet_name="Max",
            appointment_date="2024-07-21",
            appointment_time="10:30",
            clinic_name="Clínica Feliz",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_send_medical_record_notification(self, mock_email_provider):
        """Test: Enviar notificación de registro médico"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_medical_record_notification(
            to="owner@example.com",
            pet_name="Max",
            record_type="Consulta General",
            summary="Se realizó revisión completa. Pet está sano.",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_send_email_with_retry_success(self, mock_email_provider):
        """Test: Retry logic con éxito en primer intento"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_email_with_retry(
            to="test@example.com",
            subject="Test",
            html_body="<p>Test</p>",
            max_retries=3,
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_send_email_with_reply_to(self, mock_email_provider):
        """Test: Enviar email con reply-to"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_email_with_retry(
            to="test@example.com",
            subject="Test",
            html_body="<p>Test</p>",
            reply_to="support@example.com",
        )
        
        assert success is True
    
    @pytest.mark.asyncio
    async def test_send_email_with_text_body(self, mock_email_provider):
        """Test: Enviar email con texto plano"""
        service = EmailService(provider=mock_email_provider)
        
        success = await service.send_email_with_retry(
            to="test@example.com",
            subject="Test",
            html_body="<p>HTML Body</p>",
            text_body="Plain text body",
        )
        
        assert success is True
