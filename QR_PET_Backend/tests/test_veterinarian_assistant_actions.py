import json
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.schemas.assistant_actions import (
    AssistantActionConfirmRequest,
    AssistantActionIntent,
    ConfirmAppointmentAction,
)
from app.schemas.historia_clinica import HistoriaClinicaUpdate
from app.schemas.turno import TurnoCreate
from app.services.historia_clinica_service import HistoriaClinicaService
from app.services.veterinarian_assistant_action_service import (
    VeterinarianAssistantActionService,
)


@pytest.mark.asyncio
async def test_non_action_message_does_not_query_patients_or_call_the_model():
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace()),
        SimpleNamespace(id=uuid4()),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock()

    result = await service.propose("¿Cómo puedo consultar los antecedentes?")

    assert result.estado == "sin_accion"
    service.turno_repository.get_veterinarian_patients.assert_not_awaited()


@pytest.mark.asyncio
async def test_appointment_proposal_uses_only_linked_pet_and_does_not_write():
    pet_id = uuid4()
    owner_id = uuid4()
    veterinarian_id = uuid4()
    pet = SimpleNamespace(id=pet_id, usuario_id=owner_id, nombre="Luna", especie="gato")
    start = datetime(2026, 11, 2, 13, 0, tzinfo=timezone.utc)
    end = datetime(2026, 11, 2, 13, 30, tzinfo=timezone.utc)
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace()),
        SimpleNamespace(id=veterinarian_id),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock(return_value=[pet])
    service.historia_repository.get_recent_by_veterinarian = AsyncMock(return_value=[])
    service._extract_intent = AsyncMock(return_value=AssistantActionIntent(
        accion="turno",
        mascota_id=str(pet_id),
        fecha_hora_inicio=start,
        fecha_hora_fin=end,
        tipo_servicio="Vacunación",
    ))
    service.turno_repository.create = AsyncMock()

    result = await service.propose("Agendá un turno para Luna.")

    assert result.estado == "propuesta"
    assert result.accion.tipo == "turno"
    assert result.accion.datos.mascota_id == pet_id
    assert result.accion.datos.dueno_id == owner_id
    assert result.accion.datos.fecha_hora_inicio == start
    service.turno_repository.create.assert_not_awaited()


@pytest.mark.asyncio
async def test_action_for_unknown_pet_returns_clarification_without_proposal():
    pet = SimpleNamespace(id=uuid4(), usuario_id=uuid4(), nombre="Luna", especie="gato")
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace()),
        SimpleNamespace(id=uuid4()),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock(return_value=[pet])
    service.historia_repository.get_recent_by_veterinarian = AsyncMock(return_value=[])
    service._extract_intent = AsyncMock(return_value=AssistantActionIntent(
        accion="historia_clinica_nueva",
        mascota_id=str(uuid4()),
        motivo_consulta="Control anual",
    ))

    result = await service.propose("Crear historia clínica para una mascota.")

    assert result.estado == "aclaracion"
    assert "Luna" in result.mensaje
    assert result.accion is None


@pytest.mark.asyncio
async def test_spoken_appointment_request_without_end_time_asks_for_duration():
    pet_id = uuid4()
    pet = SimpleNamespace(
        id=pet_id,
        usuario_id=uuid4(),
        nombre="Calixta",
        especie="perro",
    )
    generate_content = Mock(return_value=SimpleNamespace(text=json.dumps({
        "accion": "turno",
        "mascota_id": str(pet_id),
        "fecha_hora_inicio": "2026-10-25T15:00:00-03:00",
        "tipo_servicio": "Bano",
    })))
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace(
            models=SimpleNamespace(generate_content=generate_content)
        )),
        SimpleNamespace(id=uuid4()),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock(return_value=[pet])
    service.historia_repository.get_recent_by_veterinarian = AsyncMock(return_value=[])

    result = await service.propose(
        "agenda un turno para Calixta para el dia 25 de octubre a las 15 horas bano"
    )

    assert result.estado == "aclaracion"
    assert "fecha y hora de fin" in result.mensaje
    assert result.accion is None
    config = generate_content.call_args.kwargs["config"]
    assert config.response_mime_type == "application/json"
    assert config.response_schema.type == "OBJECT"


@pytest.mark.asyncio
async def test_intent_extraction_accepts_parsed_structured_response():
    pet_id = uuid4()
    parsed_response = {
        "accion": "turno",
        "mascota_id": str(pet_id),
        "fecha_hora_inicio": "2026-10-25T12:00:00-03:00",
        "fecha_hora_fin": "2026-10-25T13:00:00-03:00",
        "tipo_servicio": "Baño",
    }
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace(
            models=SimpleNamespace(generate_content=Mock(return_value=SimpleNamespace(
                parsed=parsed_response,
                text=None,
            )))
        )),
        SimpleNamespace(id=uuid4()),
    )
    pet = SimpleNamespace(id=pet_id, nombre="Calixta", especie="perro")

    intent = await service._extract_intent(
        question="Agendar turno para Calixta.",
        history=[],
        pets=[pet],
        records=[],
        continue_action=False,
    )

    assert intent.accion == "turno"
    assert intent.mascota_id == str(pet_id)
    assert intent.fecha_hora_fin.isoformat() == "2026-10-25T13:00:00-03:00"


@pytest.mark.asyncio
async def test_action_clarification_follow_up_merges_previous_turn_details():
    pet_id = uuid4()
    pet = SimpleNamespace(
        id=pet_id,
        usuario_id=uuid4(),
        nombre="Calixta",
        especie="perro",
    )
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace()),
        SimpleNamespace(id=uuid4()),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock(return_value=[pet])
    service.historia_repository.get_recent_by_veterinarian = AsyncMock(return_value=[])
    service._extract_intent = AsyncMock(return_value=AssistantActionIntent(
        accion="turno",
        mascota_id=str(pet_id),
        fecha_hora_inicio=datetime(2026, 10, 25, 12, 0, tzinfo=timezone(
            timedelta(hours=-3)
        )),
        fecha_hora_fin=datetime(2026, 10, 25, 13, 0, tzinfo=timezone(
            timedelta(hours=-3)
        )),
        tipo_servicio="Baño",
    ))
    history = [
        {"role": "user", "content": "Agenda un turno para Calixta el 25 de octubre a las 12 hs baño."},
        {"role": "assistant", "content": "Para agendar el turno de Calixta, indicame: fecha y hora de fin."},
    ]

    result = await service.propose(
        "fecha 25 de octubre o 25/10 hora 12 hs a 13 hs",
        history,
        continue_action=True,
    )

    assert result.estado == "propuesta"
    assert result.accion.tipo == "turno"
    assert result.accion.datos.tipo_servicio == "Baño"
    service._extract_intent.assert_awaited_once_with(
        question="fecha 25 de octubre o 25/10 hora 12 hs a 13 hs",
        history=history,
        pets=[pet],
        records=[],
        continue_action=True,
    )


@pytest.mark.asyncio
async def test_unrecognized_pending_action_follow_up_stays_in_action_flow():
    pet = SimpleNamespace(
        id=uuid4(),
        usuario_id=uuid4(),
        nombre="Calixta",
        especie="perro",
    )
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace()),
        SimpleNamespace(id=uuid4()),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock(return_value=[pet])
    service.historia_repository.get_recent_by_veterinarian = AsyncMock(return_value=[])
    service._extract_intent = AsyncMock(return_value=AssistantActionIntent(
        accion="ninguna",
    ))

    result = await service.propose(
        "no entiendo, el viernes",
        [{"role": "assistant", "content": "Indicame la hora de fin."}],
        continue_action=True,
    )

    assert result.estado == "aclaracion"
    assert "solicitud pendiente" in result.mensaje


@pytest.mark.asyncio
async def test_confirmed_appointment_returns_persisted_turn_id_and_local_start(monkeypatch):
    veterinarian_id = uuid4()
    turno_id = uuid4()
    start = datetime(2026, 10, 25, 18, 0)
    created_turno = SimpleNamespace(id=turno_id, fecha_hora_inicio=start)
    agendar_turno = AsyncMock(return_value=created_turno)
    turno_service = SimpleNamespace(agendar_turno=agendar_turno)
    monkeypatch.setattr(
        "app.services.veterinarian_assistant_action_service.TurnoService",
        lambda db: turno_service,
    )
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(),
        SimpleNamespace(id=veterinarian_id),
    )
    action = ConfirmAppointmentAction(
        tipo="turno",
        datos=TurnoCreate(
            mascota_id=uuid4(),
            fecha_hora_inicio=datetime(2026, 10, 25, 15, 0, tzinfo=timezone(
                timedelta(hours=-3)
            )),
            fecha_hora_fin=datetime(2026, 10, 25, 15, 30, tzinfo=timezone(
                timedelta(hours=-3)
            )),
            tipo_servicio="Baño",
        ),
    )

    result = await service.confirm(AssistantActionConfirmRequest(accion=action))

    agendar_turno.assert_awaited_once_with(action.datos, service.veterinarian)
    assert result.turno_id == turno_id
    assert result.fecha_hora_inicio.isoformat() == "2026-10-25T15:00:00-03:00"


def test_history_update_selector_only_returns_an_exact_allowed_record():
    allowed = SimpleNamespace(id=uuid4())

    assert VeterinarianAssistantActionService._select_history_record(
        str(allowed.id), [allowed]
    ) is allowed
    assert VeterinarianAssistantActionService._select_history_record(
        str(uuid4()), [allowed]
    ) is None
    assert VeterinarianAssistantActionService._select_history_record(
        "no-es-uuid", [allowed]
    ) is None


@pytest.mark.asyncio
async def test_history_update_proposal_contains_only_the_exact_linked_record():
    pet_id = uuid4()
    record_id = uuid4()
    veterinarian_id = uuid4()
    pet = SimpleNamespace(id=pet_id, usuario_id=uuid4(), nombre="Luna", especie="gato")
    record = SimpleNamespace(
        id=record_id,
        mascota_id=pet_id,
        fecha_consulta=datetime(2026, 10, 12, 14, 0),
        motivo_consulta="Control anual",
    )
    service = VeterinarianAssistantActionService(
        SimpleNamespace(),
        SimpleNamespace(ai_client=SimpleNamespace()),
        SimpleNamespace(id=veterinarian_id),
    )
    service.turno_repository.get_veterinarian_patients = AsyncMock(return_value=[pet])
    service.historia_repository.get_recent_by_veterinarian = AsyncMock(return_value=[record])
    service._extract_intent = AsyncMock(return_value=AssistantActionIntent(
        accion="historia_clinica_actualizar",
        mascota_id=str(pet_id),
        historia_clinica_id=str(record_id),
        diagnostico="Dermatitis leve",
    ))
    service.historia_repository.update = AsyncMock()

    result = await service.propose("Actualizá el diagnóstico de la última historia de Luna.")

    assert result.estado == "propuesta"
    assert result.accion.tipo == "historia_clinica_actualizar"
    assert result.accion.historia_id == record_id
    assert result.accion.datos_actualizados == HistoriaClinicaUpdate(
        diagnostico="Dermatitis leve"
    )
    service.historia_repository.update.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_cannot_update_another_veterinarian_history():
    veterinarian_id = uuid4()
    record = SimpleNamespace(id=uuid4(), veterinario_id=uuid4(), mascota_id=uuid4())
    service = HistoriaClinicaService(SimpleNamespace())
    service.repository.get_by_id = AsyncMock(return_value=record)
    service.repository.update = AsyncMock()

    with pytest.raises(HTTPException) as error:
        await service.actualizar_consulta(
            record.id,
            HistoriaClinicaUpdate(diagnostico="Actualización no autorizada"),
            SimpleNamespace(id=veterinarian_id),
        )

    assert error.value.status_code == 404
    service.repository.update.assert_not_awaited()


@pytest.mark.asyncio
async def test_veterinarian_history_update_persists_and_reindexes():
    veterinarian_id = uuid4()
    pet_id = uuid4()
    record = SimpleNamespace(
        id=uuid4(),
        veterinario_id=veterinarian_id,
        mascota_id=pet_id,
        vectorizada=True,
    )
    service = HistoriaClinicaService(SimpleNamespace(), SimpleNamespace())
    service.repository.get_by_id = AsyncMock(return_value=record)
    service.repository.update = AsyncMock(return_value=record)
    service.turno_repository.has_veterinarian_patient = AsyncMock(return_value=True)
    service._vectorize_record = AsyncMock(return_value=True)
    changes = HistoriaClinicaUpdate(diagnostico="Dermatitis leve")

    result = await service.actualizar_consulta(
        record.id, changes, SimpleNamespace(id=veterinarian_id)
    )

    assert result is record
    service.repository.update.assert_awaited_once_with(
        record, {"diagnostico": "Dermatitis leve"}
    )
    service._vectorize_record.assert_awaited_once_with(record)
