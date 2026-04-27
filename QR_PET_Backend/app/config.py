"""
Configuración centralizada de la aplicación
"""
import os
from typing import Optional

class Settings:
    """Variables de entorno y configuración general"""
    
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
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    API_TITLE: str = "PetFinder API"
    API_VERSION: str = "1.0.0"
    
    # Pool de base de datos
    DB_MIN_SIZE: int = 5
    DB_MAX_SIZE: int = 20

settings = Settings()
