"""
Email Service - Envío de emails con múltiples proveedores

Soporta:
- SendGrid (recomendado)
- AWS SES
- SMTP
- Mock (testing)
"""

import asyncio
import logging
from typing import Optional, Dict, List, Tuple
from datetime import datetime
from abc import ABC, abstractmethod

from app.core.email_config import EmailConfig, EmailProvider
from app.utils.logger import logger


class EmailProvider(ABC):
    """Interfaz base para proveedores de email"""
    
    @abstractmethod
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Envía un email
        
        Returns:
            (success, message_id)
        """
        pass


class SendGridProvider(EmailProvider):
    """Proveedor de email usando SendGrid"""
    
    def __init__(self):
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content
            self.sg = SendGridAPIClient(EmailConfig.SENDGRID_API_KEY)
            self.Mail = Mail
            self.Email = Email
            self.To = To
            self.Content = Content
        except ImportError:
            raise ImportError("sendgrid package not installed. Install with: pip install sendgrid")
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Tuple[bool, str]:
        try:
            message = self.Mail(
                from_email=(EmailConfig.FROM_EMAIL, EmailConfig.FROM_NAME),
                to_emails=to,
                subject=subject,
                plain_text_content=text_body or "",
                html_content=html_body,
            )
            
            if reply_to:
                message.reply_to = reply_to
            
            response = self.sg.send(message)
            message_id = response.headers.get("X-Message-Id", "")
            
            logger.info(f"Email sent to {to} via SendGrid. Message ID: {message_id}")
            return True, message_id
        except Exception as e:
            logger.error(f"Error sending email via SendGrid: {str(e)}")
            return False, str(e)


class AWSProvider(EmailProvider):
    """Proveedor de email usando AWS SES"""
    
    def __init__(self):
        try:
            import boto3
            self.client = boto3.client(
                "ses",
                region_name=EmailConfig.AWS_REGION,
                aws_access_key_id=EmailConfig.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=EmailConfig.AWS_SECRET_ACCESS_KEY,
            )
        except ImportError:
            raise ImportError("boto3 package not installed. Install with: pip install boto3")
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Tuple[bool, str]:
        try:
            response = self.client.send_email(
                Source=f"{EmailConfig.FROM_NAME} <{EmailConfig.FROM_EMAIL}>",
                Destination={"ToAddresses": [to]},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {
                        "Text": {"Data": text_body or ""},
                        "Html": {"Data": html_body},
                    },
                },
            )
            
            message_id = response["MessageId"]
            logger.info(f"Email sent to {to} via AWS SES. Message ID: {message_id}")
            return True, message_id
        except Exception as e:
            logger.error(f"Error sending email via AWS SES: {str(e)}")
            return False, str(e)


class SMTPProvider(EmailProvider):
    """Proveedor de email usando SMTP"""
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Tuple[bool, str]:
        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{EmailConfig.FROM_NAME} <{EmailConfig.FROM_EMAIL}>"
            message["To"] = to
            
            if reply_to:
                message["Reply-To"] = reply_to
            
            if text_body:
                message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))
            
            async with aiosmtplib.SMTP(hostname=EmailConfig.SMTP_HOST, port=EmailConfig.SMTP_PORT) as smtp:
                await smtp.login(EmailConfig.SMTP_USER, EmailConfig.SMTP_PASSWORD)
                await smtp.send_message(message)
            
            logger.info(f"Email sent to {to} via SMTP")
            return True, "sent_via_smtp"
        except Exception as e:
            logger.error(f"Error sending email via SMTP: {str(e)}")
            return False, str(e)


class MockProvider(EmailProvider):
    """Proveedor mock para testing"""
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> Tuple[bool, str]:
        logger.info(f"[MOCK] Email to: {to}")
        logger.info(f"[MOCK] Subject: {subject}")
        return True, "mock_message_id_123"


class EmailService:
    """Servicio centralizado de email con retry logic"""
    
    def __init__(self, provider: Optional[EmailProvider] = None):
        if provider:
            self.provider = provider
        else:
            self.provider = self._get_provider()
    
    @staticmethod
    def _get_provider() -> EmailProvider:
        """Obtiene el proveedor según configuración"""
        if EmailConfig.PROVIDER == EmailProvider.SENDGRID:
            return SendGridProvider()
        elif EmailConfig.PROVIDER == EmailProvider.AWS_SES:
            return AWSProvider()
        elif EmailConfig.PROVIDER == EmailProvider.SMTP:
            return SMTPProvider()
        else:
            return MockProvider()
    
    async def send_email_with_retry(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        reply_to: Optional[str] = None,
        max_retries: int = EmailConfig.RETRY_ATTEMPTS,
    ) -> bool:
        """Envía email con retry logic"""
        
        for attempt in range(max_retries):
            try:
                success, message_id = await self.provider.send_email(
                    to=to,
                    subject=subject,
                    html_body=html_body,
                    text_body=text_body,
                    reply_to=reply_to,
                )
                
                if success:
                    logger.info(f"Email sent successfully to {to}")
                    return True
                
                logger.warning(f"Failed to send email to {to}: {message_id}")
                
            except Exception as e:
                logger.error(f"Error on attempt {attempt + 1}/{max_retries}: {str(e)}")
            
            # Esperar antes de reintentar (excepto en el último intento)
            if attempt < max_retries - 1:
                await asyncio.sleep(EmailConfig.RETRY_DELAY_SECONDS)
        
        logger.error(f"Failed to send email to {to} after {max_retries} attempts")
        return False
    
    async def send_reminder_vaccine(
        self,
        to: str,
        pet_name: str,
        vaccine_name: str,
        due_date: str,
    ) -> bool:
        """Envía recordatorio de vacuna"""
        subject = f"Recordatorio de vacunación para {pet_name}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Recordatorio de Vacunación</h2>
                <p>Hola,</p>
                <p>Tu mascota <strong>{pet_name}</strong> necesita la vacuna <strong>{vaccine_name}</strong>.</p>
                <p>Fecha vencimiento: <strong>{due_date}</strong></p>
                <p>Por favor, agenda una cita con tu veterinario lo antes posible.</p>
                <p>
                    <a href="https://qrpet.com/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Agendar Cita
                    </a>
                </p>
            </body>
        </html>
        """
        
        text_body = f"Recordatorio: {pet_name} necesita {vaccine_name} antes del {due_date}"
        
        return await self.send_email_with_retry(
            to=to,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
    
    async def send_appointment_reminder(
        self,
        to: str,
        pet_name: str,
        appointment_date: str,
        appointment_time: str,
        clinic_name: str,
    ) -> bool:
        """Envía recordatorio de cita"""
        subject = f"Cita confirmada para {pet_name} - {appointment_date}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Recordatorio de Cita Veterinaria</h2>
                <p>Tu cita está confirmada:</p>
                <ul>
                    <li><strong>Mascota:</strong> {pet_name}</li>
                    <li><strong>Fecha:</strong> {appointment_date}</li>
                    <li><strong>Hora:</strong> {appointment_time}</li>
                    <li><strong>Clínica:</strong> {clinic_name}</li>
                </ul>
                <p>Por favor llega 10 minutos antes.</p>
            </body>
        </html>
        """
        
        text_body = f"Cita confirmada para {pet_name} el {appointment_date} a las {appointment_time}"
        
        return await self.send_email_with_retry(
            to=to,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
        )
    
    async def send_medical_record_notification(
        self,
        to: str,
        pet_name: str,
        record_type: str,
        summary: str,
    ) -> bool:
        """Envía notificación de nuevo registro médico"""
        subject = f"Nuevo registro médico para {pet_name}"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Nuevo Registro Médico</h2>
                <p>Se ha creado un nuevo registro médico para <strong>{pet_name}</strong>:</p>
                <p><strong>Tipo:</strong> {record_type}</p>
                <p><strong>Resumen:</strong> {summary}</p>
                <p>
                    <a href="https://qrpet.com/dashboard/veterinary/medical-records" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Ver Detalles
                    </a>
                </p>
            </body>
        </html>
        """
        
        return await self.send_email_with_retry(
            to=to,
            subject=subject,
            html_body=html_body,
        )
