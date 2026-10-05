"""
Configuración centralizada de la aplicación
"""
import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Calculamos la raíz del proyecto 
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")
class Settings:
    """Variables de entorno y configuración general"""
    BASE_DIR: Path = BASE_DIR
    
    # Base de datos
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://usuario:contraseña@localhost:5432/nombre_db"
    )
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "tu-clave-secreta-super-segura-aqui")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    # Entorno
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    API_TITLE: str = "PetFinder API"
    API_VERSION: str = "1.0.0"
    
    # Pool de base de datos
    DB_MIN_SIZE: int = 5
    DB_MAX_SIZE: int = 20

    #Frontend
    STATIC_QR_DIR: Path = BASE_DIR / "static" / "qrs"
    STATIC_BRAND_DIR: Path = BASE_DIR / "static" / "brands"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
            
    SMTP_SERVER: str = "smtp-relay.brevo.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str

    # WhatsApp Cloud API (los recordatorios quedan desactivados hasta configurar estas variables)
    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_TEMPLATE_NAME: str = os.getenv("WHATSAPP_TEMPLATE_NAME", "turno_recordatorio")
    WHATSAPP_TEMPLATE_LANGUAGE: str = os.getenv("WHATSAPP_TEMPLATE_LANGUAGE", "es_AR")
    WHATSAPP_ACTIVATION_TEMPLATE_NAME: str = os.getenv(
        "WHATSAPP_ACTIVATION_TEMPLATE_NAME", "activacion_cuenta"
    )
    WHATSAPP_API_VERSION: str = os.getenv("WHATSAPP_API_VERSION", "v22.0")
    REMINDER_TIMEZONE: str = os.getenv("REMINDER_TIMEZONE", "America/Argentina/Buenos_Aires")
    
class Config:
        env_file = ".env"
        extra = "ignore"
settings = Settings()