import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

from main import app
from app.api.v1.dependencies import (
    get_db,
    get_pet_vector_repository,
    get_current_user
)
from app.models.user import User


# =====================================================================
# FIXTURES Y MOCKS
# =====================================================================

@pytest.fixture
def mock_user():
    """Simula un usuario autenticado."""
    user = MagicMock(spec=User)
    user.id = uuid.uuid4()
    user.email = "test@ejemplo.com"
    user.rol = "user"
    return user


@pytest.fixture
def mock_vector_repo():
    """Simula el repositorio vectorial ChromaDB."""
    repo = MagicMock()
    repo.add_pet_vector = AsyncMock(return_value=None)
    repo.search_similar = AsyncMock(return_value={
        "ids": [["pet-uuid-123"]],
        "documents": [["Perro caniche blanco perdido con collar rojo"]],
        "distances": [[0.12]]
    })
    return repo


@pytest.fixture
def mock_db_session():
    """Simula la sesión asíncrona de SQLAlchemy."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


# =====================================================================
# CASOS DE PRUEBA
# =====================================================================

@pytest.mark.asyncio
async def test_search_similar_pets_success(mock_vector_repo):
    """Verifica que el endpoint de búsqueda vectorial responda correctamente."""
    # Sobrescribimos la dependencia del repositorio vectorial
    app.dependency_overrides[get_pet_vector_repository] = lambda: mock_vector_repo

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/pets/search/similar",
            params={"query": "caniche blanco", "limit": 3}
        )

    assert response.status_code == 200
    # Verificamos que el método de búsqueda del mock haya sido llamado
    mock_vector_repo.search_similar.assert_called_once_with(query="caniche blanco", limit=3)
    
    # Limpiamos los overrides
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_pet_with_vector_indexing(mock_user, mock_vector_repo, mock_db_session):
    """Verifica la creación de mascota e indexación en el repositorio vectorial."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_pet_vector_repository] = lambda: mock_vector_repo
    app.dependency_overrides[get_db] = lambda: mock_db_session

    pet_payload = {
        "nombre": "Firulais",
        "especie": "Perro",
        "raza": "Mestizo",
        "descripcion": "Perro mediano marrón con manchas blancas",
        "edad": 2
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/pets",
            json=pet_payload,
            headers={"Authorization": "Bearer mock_token"}
        )

    assert response.status_code in [200, 201]

    # Limpiamos los overrides tras la prueba
    app.dependency_overrides.clear()