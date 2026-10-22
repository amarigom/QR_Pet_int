from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

from app.core.constants import UserRole
from app.repositories.pet_repository import PetRepository
from app.repositories.turno_repository import TurnoRepository
from app.repositories.veterinarian_dashboard_repository import (
    VeterinarianDashboardRepository,
)
from app.services.historia_clinica_service import HistoriaClinicaService
from app.services.pet_service import PetService


@pytest.mark.asyncio
async def test_pet_owner_can_link_existing_pet_to_active_veterinarian():
    owner_id = uuid4()
    pet_id = uuid4()
    veterinarian_id = uuid4()
    clinic = SimpleNamespace(user_id=veterinarian_id)
    linked_clinics = [{"veterinario_id": veterinarian_id}]
    service = PetService(AsyncMock())
    service.pet_repo.get_by_id = AsyncMock(
        return_value=SimpleNamespace(id=pet_id, usuario_id=owner_id)
    )
    service.pet_repo.get_active_veterinarian = AsyncMock(return_value=clinic)
    service.pet_repo.link_veterinarian_to_pet = AsyncMock()
    service.pet_repo.get_veterinarians_for_pet = AsyncMock(return_value=linked_clinics)

    result = await service.link_veterinarian(
        SimpleNamespace(id=owner_id, rol=UserRole.USER),
        pet_id,
        veterinarian_id,
    )

    assert result == linked_clinics
    service.pet_repo.link_veterinarian_to_pet.assert_awaited_once_with(
        pet_id, veterinarian_id
    )


@pytest.mark.asyncio
async def test_customer_cannot_link_a_pet_owned_by_someone_else():
    service = PetService(AsyncMock())
    service.pet_repo.get_by_id = AsyncMock(
        return_value=SimpleNamespace(usuario_id=uuid4())
    )
    service.pet_repo.get_active_veterinarian = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.link_veterinarian(
            SimpleNamespace(id=uuid4(), rol=UserRole.USER),
            uuid4(),
            uuid4(),
        )

    assert error.value.status_code == 404
    service.pet_repo.get_active_veterinarian.assert_not_awaited()


@pytest.mark.asyncio
async def test_pet_cannot_be_linked_to_two_veterinarians_at_once():
    owner_id = uuid4()
    pet_id = uuid4()
    target_veterinarian_id = uuid4()
    current_veterinarian_id = uuid4()
    service = PetService(AsyncMock())
    service.pet_repo.get_by_id = AsyncMock(
        return_value=SimpleNamespace(id=pet_id, usuario_id=owner_id)
    )
    service.pet_repo.get_active_veterinarian = AsyncMock(return_value=object())
    service.pet_repo.link_veterinarian_to_pet = AsyncMock()
    service.pet_repo.get_veterinarians_for_pet = AsyncMock(return_value=[{
        "veterinario_id": current_veterinarian_id,
    }])

    with pytest.raises(HTTPException) as error:
        await service.link_veterinarian(
            SimpleNamespace(id=owner_id, rol=UserRole.USER),
            pet_id,
            target_veterinarian_id,
        )

    assert error.value.status_code == 409


@pytest.mark.asyncio
async def test_veterinarian_cannot_use_customer_clinic_search():
    service = PetService(AsyncMock())
    service.pet_repo.search_active_veterinarians = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.search_veterinarians(
            SimpleNamespace(id=uuid4(), rol=UserRole.VETERINARIO),
            "clinic",
        )

    assert error.value.status_code == 403
    service.pet_repo.search_active_veterinarians.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_patient_access_includes_explicit_pet_links():
    db = SimpleNamespace(
        execute=AsyncMock(
            return_value=SimpleNamespace(scalar_one_or_none=lambda: uuid4())
        )
    )

    assert await TurnoRepository(db).has_veterinarian_patient(uuid4(), uuid4())

    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "veterinario_mascotas.veterinario_id" in sql
    assert "veterinario_mascotas.mascota_id" in sql


def test_veterinarian_dashboard_patient_ids_include_owner_linked_pets():
    repository = VeterinarianDashboardRepository(AsyncMock())

    linked_pet_ids = repository._linked_pet_ids(uuid4())
    sql = str(
        linked_pet_ids.select().compile(dialect=postgresql.dialect())
    )

    assert "veterinario_mascotas" in sql
    assert "turnos" in sql
    assert "historias_clinicas" in sql


@pytest.mark.asyncio
async def test_veterinarian_search_only_returns_active_clinics():
    db = SimpleNamespace(execute=AsyncMock(return_value=SimpleNamespace(all=lambda: [])))

    await PetRepository(db).search_active_veterinarians("norte")

    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "perfiles_veterinarios.activo IS true" in sql
    assert "usuarios.rol" in sql
    assert "ILIKE" in sql
    assert "LIMIT" in sql


@pytest.mark.asyncio
async def test_linked_veterinarian_can_read_pet_medical_history():
    veterinarian_id = uuid4()
    pet_id = uuid4()
    records = [SimpleNamespace(id=uuid4())]
    service = HistoriaClinicaService(AsyncMock())
    service.turno_repository.has_veterinarian_patient = AsyncMock(return_value=True)
    service.turno_repository.has_direct_veterinarian_link = AsyncMock(return_value=True)
    service.repository.get_all_by_pet = AsyncMock(return_value=records)
    service.repository.get_by_veterinarian_and_pet = AsyncMock()

    result = await service.obtener_por_mascota(
        pet_id,
        SimpleNamespace(id=veterinarian_id),
    )

    assert result == records
    service.repository.get_all_by_pet.assert_awaited_once_with(pet_id)
    service.repository.get_by_veterinarian_and_pet.assert_not_awaited()
