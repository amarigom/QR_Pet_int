from types import SimpleNamespace
from unittest.mock import AsyncMock
from datetime import date, datetime, timezone

import pytest
from fastapi import HTTPException

from app.api.v1.dependencies import require_veterinarian
from app.core.constants import UserRole
from app.models.turno import EstadoTurno, Turno
from app.repositories.turno_repository import TurnoRepository
from app.schemas.historia_clinica import HistoriaClinicaCreate
from app.schemas.turno import TurnoCreate, TurnoUpdateEstado
from app.schemas.veterinarian_dashboard import VeterinarianDashboardResponse
from app.services.historia_clinica_service import HistoriaClinicaService
from app.services.turno_service import TurnoService
from tests.fixtures.veterinarian_examples import (
    APPOINTMENT,
    CLIENT,
    CLIENT_ID,
    MEDICAL_RECORD,
    PET_ID,
    PET,
    QR,
    QR_ID,
    APPOINTMENT_START,
    VETERINARIAN_ID,
)


@pytest.mark.asyncio
async def test_veterinarian_role_is_required():
    veterinarian = SimpleNamespace(rol=UserRole.VETERINARIO)
    client = SimpleNamespace(rol=UserRole.USER)

    assert await require_veterinarian(veterinarian) is veterinarian
    with pytest.raises(HTTPException) as error:
        await require_veterinarian(client)
    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_appointment_links_customer_pet_and_authenticated_vet():
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(
        scalar_one_or_none=lambda: SimpleNamespace(id=PET_ID, usuario_id=CLIENT_ID)
    )
    veterinarian = SimpleNamespace(id=VETERINARIAN_ID)
    service = TurnoService(db)
    service.repository.create = AsyncMock(side_effect=lambda turno: turno)

    appointment = await service.agendar_turno(
        TurnoCreate.model_validate(APPOINTMENT),
        veterinarian,
    )

    assert appointment.veterinario_id == VETERINARIAN_ID
    assert appointment.mascota_id == PET_ID
    assert appointment.dueno_id == CLIENT_ID
    service.repository.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_appointment_rejects_a_customer_who_does_not_own_the_pet():
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(
        scalar_one_or_none=lambda: SimpleNamespace(id=PET_ID, usuario_id=CLIENT_ID)
    )
    service = TurnoService(db)
    service.repository.create = AsyncMock()
    payload = {**APPOINTMENT, "dueno_id": str(VETERINARIAN_ID)}

    with pytest.raises(HTTPException) as error:
        await service.agendar_turno(
            TurnoCreate.model_validate(payload),
            SimpleNamespace(id=VETERINARIAN_ID),
        )

    assert error.value.status_code == 400
    service.repository.create.assert_not_awaited()


@pytest.mark.asyncio
async def test_medical_record_requires_a_veterinarian_appointment_for_the_pet():
    db = AsyncMock()
    service = HistoriaClinicaService(db)
    service.turno_repository.has_veterinarian_patient = AsyncMock(return_value=False)
    service.repository.create = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.registrar_consulta(
            HistoriaClinicaCreate.model_validate(MEDICAL_RECORD),
            SimpleNamespace(id=VETERINARIAN_ID),
        )

    assert error.value.status_code == 404
    service.repository.create.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_can_register_a_medical_record_for_an_appointed_pet():
    db = AsyncMock()
    service = HistoriaClinicaService(db)
    service.turno_repository.has_veterinarian_patient = AsyncMock(return_value=True)
    service.repository.create = AsyncMock(side_effect=lambda record: record)

    record = await service.registrar_consulta(
        HistoriaClinicaCreate.model_validate(MEDICAL_RECORD),
        SimpleNamespace(id=VETERINARIAN_ID),
    )

    assert record.veterinario_id == VETERINARIAN_ID
    assert record.mascota_id == PET_ID
    assert record.motivo_consulta == "Control anual"
    service.repository.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_veterinarian_cannot_update_another_vet_appointment():
    service = TurnoService(AsyncMock())
    service.repository.get_by_id = AsyncMock(return_value=SimpleNamespace(
        id=PET_ID,
        veterinario_id=CLIENT_ID,
        estado=EstadoTurno.PROGRAMADO,
    ))
    service.repository.update_estado = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.cambiar_estado_turno(
            PET_ID,
            TurnoUpdateEstado(nuevo_estado=EstadoTurno.ATENDIDO),
            SimpleNamespace(id=VETERINARIAN_ID),
        )

    assert error.value.status_code == 404
    service.repository.update_estado.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_can_mark_appointment_as_attended():
    appointment = SimpleNamespace(
        id=PET_ID,
        veterinario_id=VETERINARIAN_ID,
        estado=EstadoTurno.PROGRAMADO,
        observaciones=None,
    )
    service = TurnoService(AsyncMock())
    service.repository.get_by_id = AsyncMock(return_value=appointment)
    service.repository.update_estado = AsyncMock(return_value=appointment)
    payload = TurnoUpdateEstado(
        nuevo_estado=EstadoTurno.ATENDIDO,
        observaciones="Consulta realizada.",
    )

    result = await service.cambiar_estado_turno(
        PET_ID,
        payload,
        SimpleNamespace(id=VETERINARIAN_ID),
    )

    assert result is appointment
    service.repository.update_estado.assert_awaited_once_with(
        turno=appointment,
        nuevo_estado=EstadoTurno.ATENDIDO,
        observaciones="Consulta realizada.",
    )


@pytest.mark.asyncio
async def test_update_appointment_state_saves_observations():
    db = AsyncMock()
    repository = TurnoRepository(db)
    appointment = SimpleNamespace(
        estado=EstadoTurno.PROGRAMADO,
        observaciones="Observación anterior.",
    )

    result = await repository.update_estado(
        turno=appointment,
        nuevo_estado=EstadoTurno.ATENDIDO,
        observaciones="",
    )

    assert result is appointment
    assert appointment.estado is EstadoTurno.ATENDIDO
    assert appointment.observaciones == ""
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(appointment)


@pytest.mark.asyncio
async def test_weekly_agenda_requires_exactly_seven_days():
    service = TurnoService(AsyncMock())
    service.repository.get_weekly_agenda = AsyncMock(return_value=[])

    with pytest.raises(HTTPException) as error:
        await service.obtener_agenda_semanal(
            datetime(2026, 10, 5, tzinfo=timezone.utc),
            datetime(2026, 10, 11, tzinfo=timezone.utc),
            VETERINARIAN_ID,
        )

    assert error.value.status_code == 422
    service.repository.get_weekly_agenda.assert_not_awaited()


@pytest.mark.asyncio
async def test_deleting_appointment_cancels_it_without_hard_deleting():
    appointment = SimpleNamespace(
        id=PET_ID,
        veterinario_id=VETERINARIAN_ID,
        estado=EstadoTurno.PROGRAMADO,
    )
    service = TurnoService(AsyncMock())
    service.repository.get_by_id = AsyncMock(return_value=appointment)
    service.repository.update_estado = AsyncMock(return_value=appointment)

    result = await service.eliminar_turno(
        PET_ID,
        SimpleNamespace(id=VETERINARIAN_ID),
    )

    assert result is appointment
    service.repository.update_estado.assert_awaited_once_with(
        turno=appointment,
        nuevo_estado=EstadoTurno.CANCELADO,
    )


def test_example_customer_pet_qr_appointment_and_medical_record_are_valid():
    appointment = TurnoCreate.model_validate(APPOINTMENT)
    medical_record = HistoriaClinicaCreate.model_validate(MEDICAL_RECORD)

    assert PET["usuario_id"] == CLIENT_ID
    assert QR["mascota_id"] == PET_ID
    assert QR["id"] == QR_ID
    assert appointment.dueno_id == CLIENT_ID
    assert appointment.mascota_id == medical_record.mascota_id == PET_ID
    assert medical_record.motivo_consulta == "Control anual"
    assert Turno.__tablename__ == "turnos"


def test_example_records_fit_the_veterinarian_dashboard_response():
    qr = {
        **QR,
        "created_at": APPOINTMENT_START.isoformat(),
        "lote": "DEMO",
    }
    pet = {
        **PET,
        "qr": qr,
    }
    appointment = {
        "id": "50000000-0000-4000-8000-000000000007",
        **APPOINTMENT,
        "veterinario_id": str(VETERINARIAN_ID),
        "estado": EstadoTurno.PROGRAMADO.value,
        "recordatorio_enviado": False,
        "created_at": APPOINTMENT_START.isoformat(),
    }
    medical_record = {
        "id": "50000000-0000-4000-8000-000000000006",
        **MEDICAL_RECORD,
        "veterinario_id": str(VETERINARIAN_ID),
        "fecha_consulta": APPOINTMENT_START.isoformat(),
        "created_at": APPOINTMENT_START.isoformat(),
    }
    response = VeterinarianDashboardResponse.model_validate({
        "clients": [CLIENT],
        "available_clients": [CLIENT],
        "pets": [pet],
        "available_pets": [pet],
        "qrs": [QR],
        "scans": [],
        "medical_records": [medical_record],
        "appointments": [appointment],
    })

    assert response.clients[0].id == CLIENT_ID
    assert response.pets[0].qr.codigo == "QR-DEMO-0001"
    assert response.medical_records[0].motivo_consulta == "Control anual"
    assert response.appointments[0].estado == EstadoTurno.PROGRAMADO


def test_appointment_state_model_matches_database_varchar_column():
    estado_column = Turno.__table__.c.estado

    assert estado_column.type.native_enum is False
    assert estado_column.type.length == 30
