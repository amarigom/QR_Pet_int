"""
Email Configuration

Soporta múltiples proveedores:
1. SendGrid - Recomendado (fácil integración, templates, tracking)
2. AWS SES - Económico (integración con boto3)
3. SMTP - Custom (configurable, menos reliable)
"""

import os
from enum import Enum


class EmailProvider(str, Enum):
    """Proveedores de email soportados"""
    SENDGRID = "sendgrid"
    AWS_SES = "aws_ses"
    SMTP = "smtp"
    MOCK = "mock"  # Para testing


class EmailConfig:
    """Configuración de email según el proveedor"""
    
    # Proveedor activo
    PROVIDER: EmailProvider = EmailProvider(
        os.getenv("EMAIL_PROVIDER", "sendgrid")
    )
    
    # Información general
    FROM_EMAIL: str = os.getenv("EMAIL_FROM", "noreply@qrpet.com")
    FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "QR Pet")
    
    # SendGrid
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    
    # AWS SES
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    
    # SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # Configuración general
    RETRY_ATTEMPTS: int = 3
    RETRY_DELAY_SECONDS: int = 5
    
    @classmethod
    def validate(cls) -> bool:
        """Valida que la configuración de email sea válida"""
        if cls.PROVIDER == EmailProvider.SENDGRID:
            return bool(cls.SENDGRID_API_KEY)
        elif cls.PROVIDER == EmailProvider.AWS_SES:
            return bool(cls.AWS_ACCESS_KEY_ID and cls.AWS_SECRET_ACCESS_KEY)
        elif cls.PROVIDER == EmailProvider.SMTP:
            return bool(cls.SMTP_USER and cls.SMTP_PASSWORD)
        elif cls.PROVIDER == EmailProvider.MOCK:
            return True
        return False


# Email templates paths
EMAIL_TEMPLATES_DIR = "app/templates/emails"

TEMPLATE_PATHS = {
    "reminder_vaccine": f"{EMAIL_TEMPLATES_DIR}/reminder_vaccine.html",
    "reminder_appointment": f"{EMAIL_TEMPLATES_DIR}/reminder_appointment.html",
    "appointment_confirmed": f"{EMAIL_TEMPLATES_DIR}/appointment_confirmed.html",
    "appointment_canceled": f"{EMAIL_TEMPLATES_DIR}/appointment_canceled.html",
    "medical_record_created": f"{EMAIL_TEMPLATES_DIR}/medical_record_created.html",
    "treatment_update": f"{EMAIL_TEMPLATES_DIR}/treatment_update.html",
}
