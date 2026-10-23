from datetime import date, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from sqlalchemy.dialects import postgresql

from app.models.turno import EstadoTurno
from app.repositories.turno_repository import TurnoRepository
from app.schemas.assistant_appointment_query import AssistantAppointmentQueryIntent
from app.services.veterinarian_appointment_query_service import (
    ARGENTINA_TIMEZONE,
    VeterinarianAppointmentQueryService,
)


def make_service():
    service = VeterinarianAppointmentQueryService(
        SimpleNamespace(),
        SimpleNamespace(),
        SimpleNamespace(id=uuid4()),
    )
    service.repository.list_for_assistant = AsyncMock(return_value=[])
    service.repository.count_for_assistant = AsyncMock(return_value={
        "PROGRAMADO": 0,
        "ATENDIDO": 0,
        "CANCELADO": 0,
    })
    return service


def test_query_detector_distinguishes_read_requests_from_booking_commands():
    assert VeterinarianAppointmentQueryService.looks_like_query(
        "¿Qué turnos tiene Calixta?"
    )
    assert VeterinarianAppointmentQueryService.looks_like_query(
        "¿Cuántos turnos tengo esta semana?"
    )
    assert VeterinarianAppointmentQueryService.looks_like_query(
        "Cuántos turnos programados hay esta semana"
    )
    assert VeterinarianAppointmentQueryService.looks_like_query(
        "Cuántos turnos programados hay en la semana del 19 al 25 de octubre"
    )
    assert not VeterinarianAppointmentQueryService.looks_like_query(
        "Agendá un turno para Calixta."
    )
    assert not VeterinarianAppointmentQueryService.looks_like_query(
        "Programá un turno para Calixta."
    )


@pytest.mark.asyncio
async def test_unrelated_message_does_not_call_database_or_model():
    service = make_service()

    result = await service.query("¿Cómo cargo una historia clínica?")

    assert result.estado == "sin_consulta"
    service.repository.list_for_assistant.assert_not_awaited()
    service.repository.count_for_assistant.assert_not_awaited()


@pytest.mark.asyncio
async def test_list_query_is_scoped_to_authenticated_vet_and_applies_filters():
    veterinarian_id = uuid4()
    service = make_service()
    service.veterinarian = SimpleNamespace(id=veterinarian_id)
    service._extract_intent = AsyncMock(return_value=AssistantAppointmentQueryIntent(
        tipo_consulta="listar",
        fecha_desde=date(2026, 10, 25),
        fecha_hasta=date(2026, 10, 25),
        mascota_nombre="Calixta",
        estado="PROGRAMADO",
    ))
    appointment = SimpleNamespace(
        id=uuid4(),
        fecha_hora_inicio=datetime(2026, 10, 25, 15, 0),
        fecha_hora_fin=datetime(2026, 10, 25, 16, 0),
        tipo_servicio="Baño",
        estado=EstadoTurno.PROGRAMADO,
    )
    service.repository.list_for_assistant = AsyncMock(
        return_value=[(appointment, "Calixta")]
    )

    result = await service.query("¿Qué turnos tiene Calixta el 25 de octubre?")

    query = service.repository.list_for_assistant.await_args.kwargs
    assert query["veterinarian_id"] == veterinarian_id
    assert query["start"] == datetime(2026, 10, 25, 3, 0)
    assert query["end"] == datetime(2026, 10, 26, 3, 0)
    assert query["pet_name"] == "Calixta"
    assert query["state"] == EstadoTurno.PROGRAMADO
    assert query["limit"] == 51
    assert result.estado == "resultado"
    assert result.turnos[0].mascota_nombre == "Calixta"
    assert result.turnos[0].fecha_hora_inicio.isoformat() == "2026-10-25T12:00:00-03:00"


@pytest.mark.asyncio
async def test_summary_counts_all_states_and_is_not_limited_to_first_page():
    service = make_service()
    service._extract_intent = AsyncMock(return_value=AssistantAppointmentQueryIntent(
        tipo_consulta="resumen",
        fecha_desde=date(2026, 10, 25),
        fecha_hasta=date(2026, 10, 25),
    ))
    service.repository.count_for_assistant = AsyncMock(return_value={
        "PROGRAMADO": 2,
        "ATENDIDO": 3,
        "CANCELADO": 1,
    })
    service.repository.list_for_assistant.assert_not_awaited()

    result = await service.query("¿Cuántos turnos tengo el 25 de octubre?")

    service.repository.count_for_assistant.assert_awaited_once()
    assert service.repository.count_for_assistant.await_args.kwargs[
        "include_cancelled"
    ] is True
    assert result.resumen == {"PROGRAMADO": 2, "ATENDIDO": 3, "CANCELADO": 1}
    assert "Total: 6" in result.respuesta


@pytest.mark.asyncio
async def test_user_reported_programmed_appointments_question_uses_sql_summary():
    service = make_service()
    service._extract_intent = AsyncMock(return_value=AssistantAppointmentQueryIntent(
        tipo_consulta="ninguna",
    ))
    service.repository.count_for_assistant = AsyncMock(return_value={
        "PROGRAMADO": 7,
        "ATENDIDO": 0,
        "CANCELADO": 0,
    })

    result = await service.query("Cuántos turnos programados hay esta semana")

    count_query = service.repository.count_for_assistant.await_args.kwargs
    local_today = datetime.now(ARGENTINA_TIMEZONE).date()
    assert count_query["start"] == service._local_midnight_utc_naive(
        local_today - timedelta(days=local_today.weekday())
    )
    assert count_query["state"] == EstadoTurno.PROGRAMADO
    assert "Total: 7" in result.respuesta
    service.repository.list_for_assistant.assert_not_awaited()


@pytest.mark.asyncio
async def test_week_summary_overrides_model_range_with_local_calendar_week():
    service = make_service()
    current_year = datetime.now(ARGENTINA_TIMEZONE).year
    service._extract_intent = AsyncMock(return_value=AssistantAppointmentQueryIntent(
        tipo_consulta="resumen",
        fecha_desde=date(current_year, 10, 23),
        fecha_hasta=date(current_year, 10, 25),
        estado="PROGRAMADO",
    ))

    await service.query(
        "Cuántos turnos programados hay en la semana del 19 al 25 de octubre"
    )

    count_query = service.repository.count_for_assistant.await_args.kwargs
    week_start = date(current_year, 10, 19)
    week_end = date(current_year, 10, 25)
    assert count_query["start"] == service._local_midnight_utc_naive(week_start)
    assert count_query["end"] == service._local_midnight_utc_naive(
        week_end + timedelta(days=1)
    )
    assert count_query["state"] == EstadoTurno.PROGRAMADO


@pytest.mark.asyncio
async def test_intent_extraction_accepts_sdk_parsed_result():
    service = VeterinarianAppointmentQueryService(
        SimpleNamespace(),
        SimpleNamespace(
            models=SimpleNamespace(generate_content=Mock(return_value=SimpleNamespace(
                parsed={
                    "tipo_consulta": "listar",
                    "fecha_desde": "2026-10-25",
                    "fecha_hasta": "2026-10-25",
                    "mascota_nombre": "Calixta",
                },
                text=None,
            )))
        ),
        SimpleNamespace(id=uuid4()),
    )

    intent = await service._extract_intent(
        "¿Qué turnos tiene Calixta el 25 de octubre?",
        [],
    )

    assert intent.tipo_consulta == "listar"
    assert intent.fecha_desde == date(2026, 10, 25)
    assert intent.fecha_hasta == date(2026, 10, 25)
    assert intent.mascota_nombre == "Calixta"


@pytest.mark.asyncio
async def test_query_rejects_ranges_longer_than_31_days():
    service = make_service()
    service._extract_intent = AsyncMock(return_value=AssistantAppointmentQueryIntent(
        tipo_consulta="listar",
        fecha_desde=date(2026, 10, 1),
        fecha_hasta=date(2026, 11, 2),
    ))

    result = await service.query("¿Qué turnos tengo en octubre?")

    assert result.estado == "aclaracion"
    service.repository.list_for_assistant.assert_not_awaited()


@pytest.mark.asyncio
async def test_repository_query_always_filters_by_vet_and_status_and_pet():
    db = SimpleNamespace(execute=AsyncMock(return_value=SimpleNamespace(all=lambda: [])))
    veterinarian_id = uuid4()
    repository = TurnoRepository(db)

    await repository.list_for_assistant(
        veterinarian_id=veterinarian_id,
        start=datetime(2026, 10, 25),
        end=datetime(2026, 10, 26),
        pet_name="Calixta",
        state=EstadoTurno.PROGRAMADO,
    )

    statement = db.execute.await_args.args[0]
    compiled = statement.compile(dialect=postgresql.dialect())
    sql = str(compiled)
    assert "turnos.veterinario_id" in sql
    assert "turnos.fecha_hora_inicio >=" in sql
    assert "turnos.fecha_hora_inicio <" in sql
    assert "turnos.estado" in sql
    assert "mascotas.nombre ILIKE" in sql
    assert compiled.params["veterinario_id_1"] == veterinarian_id


@pytest.mark.asyncio
async def test_default_list_query_excludes_cancelled_turns():
    db = SimpleNamespace(execute=AsyncMock(return_value=SimpleNamespace(all=lambda: [])))
    await TurnoRepository(db).list_for_assistant(
        veterinarian_id=uuid4(),
        start=datetime(2026, 10, 25),
        end=datetime(2026, 10, 26),
    )

    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "turnos.estado !=" in sql
    assert "CANCELADO" in db.execute.await_args.args[0].compile(
        dialect=postgresql.dialect()
    ).params.values()
