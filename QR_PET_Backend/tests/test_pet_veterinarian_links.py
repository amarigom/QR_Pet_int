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
from app.services.qr_service import QRService
from app.services.scan_service import ScanService


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
async def test_pet_owner_can_read_veterinarian_links_regardless_of_role():
    owner_id = uuid4()
    pet_id = uuid4()
    linked_clinics = [{"veterinario_id": uuid4()}]
    service = PetService(AsyncMock())
    service.pet_repo.get_by_id = AsyncMock(
        return_value=SimpleNamespace(id=pet_id, usuario_id=owner_id)
    )
    service.pet_repo.get_veterinarians_for_pet = AsyncMock(
        return_value=linked_clinics
    )

    result = await service.get_pet_veterinarians(
        SimpleNamespace(id=owner_id, rol=UserRole.VETERINARIO),
        pet_id,
    )

    assert result == linked_clinics
    service.pet_repo.get_veterinarians_for_pet.assert_awaited_once_with(pet_id)


@pytest.mark.asyncio
async def test_non_owner_cannot_read_pet_veterinarian_links():
    service = PetService(AsyncMock())
    service.pet_repo.get_by_id = AsyncMock(
        return_value=SimpleNamespace(usuario_id=uuid4())
    )
    service.pet_repo.get_veterinarians_for_pet = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.get_pet_veterinarians(
            SimpleNamespace(id=uuid4(), rol=UserRole.USER),
            uuid4(),
        )

    assert error.value.status_code == 404
    service.pet_repo.get_veterinarians_for_pet.assert_not_awaited()


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
async def test_pet_owner_can_replace_qr_without_recreating_pet():
    owner_id = uuid4()
    pet_id = uuid4()
    old_qr = SimpleNamespace(activo=True)
    new_qr = SimpleNamespace(activo=True, mascota_id=None)
    db = AsyncMock()
    service = PetService(db)
    service.pet_repo.get_by_id_for_update = AsyncMock(
        return_value=SimpleNamespace(id=pet_id, usuario_id=owner_id)
    )
    service.qr_repo.get_by_code_for_update = AsyncMock(return_value=new_qr)
    service.qr_repo.get_active_by_pet_for_update = AsyncMock(
        return_value=[old_qr]
    )

    result = await service.replace_pet_qr(
        SimpleNamespace(id=owner_id, rol=UserRole.ADMIN),
        pet_id,
        " new-qr ",
    )

    assert result is new_qr
    assert old_qr.activo is False
    assert new_qr.mascota_id == pet_id
    service.qr_repo.get_by_code_for_update.assert_awaited_once_with("new-qr")
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(new_qr)


@pytest.mark.asyncio
async def test_non_owner_cannot_replace_pet_qr():
    db = AsyncMock()
    service = PetService(db)
    service.pet_repo.get_by_id_for_update = AsyncMock(
        return_value=SimpleNamespace(usuario_id=uuid4())
    )
    service.qr_repo.get_by_code_for_update = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.replace_pet_qr(
            SimpleNamespace(id=uuid4(), rol=UserRole.ADMIN),
            uuid4(),
            "new-qr",
        )

    assert error.value.status_code == 404
    service.qr_repo.get_by_code_for_update.assert_not_awaited()
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_inactive_qr_cannot_be_used_for_replacement():
    owner_id = uuid4()
    pet_id = uuid4()
    db = AsyncMock()
    service = PetService(db)
    service.pet_repo.get_by_id_for_update = AsyncMock(
        return_value=SimpleNamespace(id=pet_id, usuario_id=owner_id)
    )
    service.qr_repo.get_by_code_for_update = AsyncMock(
        return_value=SimpleNamespace(activo=False, mascota_id=None)
    )
    service.qr_repo.get_active_by_pet_for_update = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.replace_pet_qr(
            SimpleNamespace(id=owner_id, rol=UserRole.USER),
            pet_id,
            "new-qr",
        )

    assert error.value.status_code == 409
    service.qr_repo.get_active_by_pet_for_update.assert_not_awaited()
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_inactive_qr_cannot_be_scanned():
    service = ScanService(AsyncMock())
    service.qr_repo.get_by_code = AsyncMock(
        return_value=SimpleNamespace(activo=False)
    )
    service.scan_repo.create = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.create_scan(
            SimpleNamespace(codigo="RETIRED-QR", model_dump=lambda **_: {})
        )

    assert error.value.status_code == 404
    service.scan_repo.create.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_qr_access_requires_an_existing_patient_relationship():
    pet_id = uuid4()
    veterinarian_id = uuid4()
    pet = SimpleNamespace(id=pet_id)
    qr = SimpleNamespace(mascota=pet)
    db = AsyncMock()
    db.execute = AsyncMock(
        return_value=SimpleNamespace(scalar_one_or_none=lambda: qr)
    )
    service = ScanService(db)
    service.turno_repo.has_veterinarian_patient = AsyncMock(return_value=False)

    with pytest.raises(HTTPException) as error:
        await service.get_veterinarian_pet_from_qr(
            "qr-code",
            SimpleNamespace(id=veterinarian_id),
        )

    assert error.value.status_code == 404
    service.turno_repo.has_veterinarian_patient.assert_awaited_once_with(
        veterinarian_id, pet_id
    )
    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "codigos_qr.activo IS true" in sql


@pytest.mark.asyncio
async def test_veterinarian_qr_access_returns_pet_after_relationship_is_verified():
    pet = SimpleNamespace(id=uuid4())
    db = AsyncMock()
    db.execute = AsyncMock(
        return_value=SimpleNamespace(
            scalar_one_or_none=lambda: SimpleNamespace(mascota=pet)
        )
    )
    service = ScanService(db)
    service.turno_repo.has_veterinarian_patient = AsyncMock(return_value=True)

    result = await service.get_veterinarian_pet_from_qr(
        " qr-code ",
        SimpleNamespace(id=uuid4()),
    )

    assert result is pet
    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "upper" not in sql.lower()
    assert "codigos_qr.codigo = %(codigo_1)s" in sql


@pytest.mark.asyncio
async def test_paginated_medical_history_only_queries_current_veterinarian_records():
    veterinarian_id = uuid4()
    pet_id = uuid4()
    history = [SimpleNamespace(id=uuid4())]
    service = HistoriaClinicaService(AsyncMock())
    service.turno_repository.has_veterinarian_patient = AsyncMock(return_value=True)
    service.repository.get_by_veterinarian_and_pet = AsyncMock(return_value=history)
    service.repository.count_by_veterinarian_and_pet = AsyncMock(return_value=21)

    result = await service.obtener_paginadas_por_mascota(
        pet_id,
        SimpleNamespace(id=veterinarian_id),
        page=2,
        limit=10,
    )

    assert result == {
        "items": history,
        "total": 21,
        "page": 2,
        "limit": 10,
        "pages": 3,
    }
    service.repository.get_by_veterinarian_and_pet.assert_awaited_once_with(
        veterinarian_id,
        pet_id,
        limit=10,
        offset=10,
    )
    service.repository.count_by_veterinarian_and_pet.assert_awaited_once_with(
        veterinarian_id, pet_id
    )


@pytest.mark.asyncio
async def test_retired_qr_cannot_be_reactivated_when_pet_has_another_active_qr():
    pet_id = uuid4()
    retired_qr = SimpleNamespace(id=uuid4(), mascota_id=pet_id, activo=False)
    active_qr = SimpleNamespace(id=uuid4(), mascota_id=pet_id, activo=True)
    db = AsyncMock()
    service = QRService(db)
    service.qr_repo.get_by_code = AsyncMock(return_value=retired_qr)
    service.qr_repo.get_by_code_for_update = AsyncMock(return_value=retired_qr)
    service.qr_repo.get_by_mascota = AsyncMock(return_value=active_qr)
    service.qr_repo.update_status = AsyncMock()
    service.pet_repo.get_by_id_for_update = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.activar_desactivar_qr("RETIRED-QR")

    assert error.value.status_code == 409
    service.pet_repo.get_by_id_for_update.assert_awaited_once_with(pet_id)
    service.qr_repo.update_status.assert_not_awaited()
    db.commit.assert_not_awaited()


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
async def test_linked_veterinarian_reads_only_its_own_pet_medical_history():
    veterinarian_id = uuid4()
    pet_id = uuid4()
    records = [SimpleNamespace(id=uuid4())]
    service = HistoriaClinicaService(AsyncMock())
    service.turno_repository.has_veterinarian_patient = AsyncMock(return_value=True)
    service.turno_repository.has_direct_veterinarian_link = AsyncMock(return_value=True)
    service.repository.get_all_by_pet = AsyncMock()
    service.repository.get_by_veterinarian_and_pet = AsyncMock(return_value=records)

    result = await service.obtener_por_mascota(
        pet_id,
        SimpleNamespace(id=veterinarian_id),
    )

    assert result == records
    service.repository.get_by_veterinarian_and_pet.assert_awaited_once_with(
        veterinarian_id, pet_id
    )
    service.repository.get_all_by_pet.assert_not_awaited()
    service.turno_repository.has_direct_veterinarian_link.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_cannot_export_another_clinics_medical_record():
    veterinarian_id = uuid4()
    history = SimpleNamespace(veterinario_id=uuid4(), mascota_id=uuid4())
    service = HistoriaClinicaService(AsyncMock())
    service.repository.get_by_id = AsyncMock(return_value=history)
    service.turno_repository.has_direct_veterinarian_link = AsyncMock(
        return_value=True
    )

    with pytest.raises(HTTPException) as error:
        await service.exportar_historia_clinica(
            uuid4(),
            "pdf",
            SimpleNamespace(id=veterinarian_id),
        )

    assert error.value.status_code == 404
    service.turno_repository.has_direct_veterinarian_link.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_dashboard_only_queries_its_own_medical_records():
    empty_rows = SimpleNamespace(all=lambda: [])
    result = SimpleNamespace(
        scalar_one_or_none=lambda: None,
        scalars=lambda: SimpleNamespace(
            unique=lambda: empty_rows,
            all=lambda: [],
        ),
        all=lambda: [],
    )
    db = SimpleNamespace(execute=AsyncMock(side_effect=[result] * 6))
    veterinarian_id = uuid4()

    await VeterinarianDashboardRepository(db).get_dashboard_data(veterinarian_id)

    history_query = db.execute.await_args_list[4].args[0]
    sql = str(history_query.compile(dialect=postgresql.dialect()))
    assert "historias_clinicas.veterinario_id =" in sql
    assert "historias_clinicas.mascota_id IN" not in sql
