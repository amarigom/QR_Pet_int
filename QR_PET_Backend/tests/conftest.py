"""
Pytest Configuration and Fixtures

Proporciona fixtures reutilizables para todos los tests
"""

import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.config import settings
from app.services.email_service import MockProvider
from main import app


# Database setup para testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Crea un event loop para los tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Proporciona una sesión de BD para tests"""
    
    # Crear engine de test
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    
    # Crear todas las tablas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Crear session factory
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    # Yield session
    async with async_session() as session:
        yield session
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Proporciona un cliente HTTP para tests de API"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_email_provider():
    """Proporciona un proveedor de email mock"""
    return MockProvider()


@pytest.fixture
def sample_user_data():
    """Datos de usuario de prueba"""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "nombre": "Test User",
        "telefono": "1234567890",
    }


@pytest.fixture
def sample_veterinarian_data():
    """Datos de veterinario de prueba"""
    return {
        "email": "vet@clinic.com",
        "password": "VetPassword123!",
        "nombre": "Dr. García",
        "telefono": "9876543210",
        "rol": "veterinario",
        "especialidades": ["Cirugía", "Dermatología"],
        "licencia_profesional": "LIC-12345",
    }


@pytest.fixture
def sample_clinic_data():
    """Datos de clínica de prueba"""
    return {
        "nombre": "Clínica Veterinaria Feliz",
        "direccion": "Calle Principal 123",
        "ciudad": "Buenos Aires",
        "telefono": "+541112345678",
        "email": "clinic@example.com",
        "latitud": -34.6037,
        "longitud": -58.3816,
    }


@pytest.fixture
def sample_pet_data():
    """Datos de mascota de prueba"""
    return {
        "nombre": "Max",
        "especie": "Perro",
        "raza": "Golden Retriever",
        "edad": 3,
        "peso_kg": 30.5,
        "sexo": "M",
    }


@pytest.fixture
def sample_appointment_data():
    """Datos de cita de prueba"""
    from datetime import datetime, timedelta
    
    future_date = datetime.utcnow() + timedelta(days=7, hours=10)
    
    return {
        "fecha_hora": future_date.isoformat(),
        "tipo_consulta": "Consulta General",
        "duracion_minutos": 30,
        "estado": "pending",
    }


@pytest.fixture
def sample_medical_record_data():
    """Datos de registro médico de prueba"""
    return {
        "tipo": "consulta",
        "diagnostico": "Infección de oído",
        "tratamiento": "Antibióticos tópicos",
        "notas": "Revisar en 2 semanas",
    }


@pytest.fixture
def sample_vaccine_data():
    """Datos de vacunación de prueba"""
    from datetime import datetime, timedelta
    
    return {
        "nombre": "Rabia",
        "fecha_aplicacion": datetime.utcnow().isoformat(),
        "proxima_dosis": (datetime.utcnow() + timedelta(days=365)).isoformat(),
        "lote": "BATCH-2024-001",
    }
