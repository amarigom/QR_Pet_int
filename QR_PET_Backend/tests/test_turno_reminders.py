from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
import httpx
from sqlalchemy.dialects import postgresql

from app.config import settings
from app.repositories.turno_repository import TurnoRepository
from app.services.auth_service import AuthService
from app.schemas.user import UserUpdate
from app.services import turno_reminder_service
from app.services.turno_reminder_service import (
    WhatsAppCloudSender,
    _raise_for_whatsapp_response,
    send_due_appointment_reminders,
)


def test_whatsapp_rejection_includes_meta_error_details():
    response = httpx.Response(
        400,
        json={"error": {"code": 132001, "message": "Template is not approved."}},
        request=httpx.Request("POST", "https://graph.facebook.com/messages"),
    )

    with pytest.raises(
        RuntimeError,
        match=r"código 132001.*Template is not approved",
    ):
        _raise_for_whatsapp_response(response)


@pytest.mark.asyncio
async def test_due_reminder_query_disables_joined_eager_loads_before_row_lock():
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(all=lambda: [])

    await TurnoRepository(db).get_due_reminders(
        datetime(2026, 10, 4, 12),
        datetime(2026, 10, 5, 12, 10),
    )

    statement = db.execute.await_args.args[0]
    sql = str(statement.compile(dialect=postgresql.dialect()))

    assert "LEFT OUTER JOIN" not in sql
    assert "FOR UPDATE OF turnos SKIP LOCKED" in sql


@pytest.mark.asyncio
async def test_whatsapp_sender_uses_approved_template_and_consent(monkeypatch):
    monkeypatch.setattr(settings, "WHATSAPP_ACCESS_TOKEN", "test-token")
    monkeypatch.setattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "phone-id")
    monkeypatch.setattr(settings, "WHATSAPP_TEMPLATE_NAME", "turno_recordatorio")
    monkeypatch.setattr(settings, "WHATSAPP_TEMPLATE_LANGUAGE", "es_AR")
    monkeypatch.setattr(settings, "WHATSAPP_API_VERSION", "v22.0")
    monkeypatch.setattr(settings, "REMINDER_TIMEZONE", "UTC")
    request = {}

    class Response:
        def raise_for_status(self):
            return None

    class AsyncClient:
        def __init__(self, timeout):
            assert timeout == 15

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers, json):
            request.update({"url": url, "headers": headers, "json": json})
            return Response()

    monkeypatch.setattr(turno_reminder_service.httpx, "AsyncClient", AsyncClient)
    appointment = SimpleNamespace(
        fecha_hora_inicio=datetime(2026, 10, 4, 12, 30),
        tipo_servicio="Control general",
    )
    client = SimpleNamespace(
        id="client-id",
        nombre="Ana Ejemplo",
        telefono="+54 9 11 0000 0000",
        whatsapp_recordatorios_consent=True,
    )
    pet = SimpleNamespace(nombre="Luna")

    await WhatsAppCloudSender().send_appointment_reminder(appointment, client, pet)

    assert request["url"] == "https://graph.facebook.com/v22.0/phone-id/messages"
    assert request["headers"]["Authorization"] == "Bearer test-token"
    assert request["json"]["to"] == "5491100000000"
    assert request["json"]["template"]["name"] == "turno_recordatorio"
    assert [parameter["text"] for parameter in request["json"]["template"]["components"][0]["parameters"]] == [
        "Ana Ejemplo",
        "Luna",
        "04/10/2026",
        "12:30",
        "Control general",
    ]


@pytest.mark.asyncio
async def test_whatsapp_sender_rejects_clients_without_consent(monkeypatch):
    monkeypatch.setattr(settings, "WHATSAPP_ACCESS_TOKEN", "test-token")
    monkeypatch.setattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "phone-id")
    client = SimpleNamespace(
        id="client-id",
        nombre="Ana Ejemplo",
        telefono="+5491100000000",
        whatsapp_recordatorios_consent=False,
    )

    with pytest.raises(ValueError, match="no autorizó"):
        await WhatsAppCloudSender().send_appointment_reminder(
            SimpleNamespace(fecha_hora_inicio=datetime(2026, 10, 4, 12, 30)),
            client,
            SimpleNamespace(nombre="Luna"),
        )


@pytest.mark.asyncio
async def test_user_can_grant_and_revoke_reminder_consent():
    user = SimpleNamespace(
        id=uuid4(),
        email="ana@example.test",
        nombre="Ana Ejemplo",
        telefono="+5491100000000",
        avatar_url=None,
        rol="usuario",
        created_at=datetime(2026, 10, 3),
        whatsapp_recordatorios_consent=False,
    )
    db = AsyncMock()
    service = AuthService(db)

    async def update_user(**changes):
        for name, value in changes.items():
            if value is not None:
                setattr(user, name, value)
        return user

    service.user_repo.update_user = AsyncMock(side_effect=update_user)

    updated = await service.update_user_profile(
        user.id,
        UserUpdate(whatsapp_recordatorios_consent=True),
    )

    service.user_repo.update_user.assert_awaited_once_with(
        user_id=user.id,
        telefono=None,
        nombre=None,
        avatar_url=None,
        whatsapp_recordatorios_consent=True,
    )
    assert updated.whatsapp_recordatorios_consent is True
    db.commit.assert_awaited_once()

    revoked = await service.update_user_profile(
        user.id,
        UserUpdate(whatsapp_recordatorios_consent=False),
    )
    assert revoked.whatsapp_recordatorios_consent is False


@pytest.mark.asyncio
async def test_scheduler_selects_appointments_due_in_24_hours(monkeypatch):
    now = datetime(2026, 10, 3, 12, 0)
    appointment = SimpleNamespace(
        id=uuid4(),
        fecha_hora_inicio=now + timedelta(hours=24),
        recordatorio_enviado=False,
    )
    client = SimpleNamespace()
    pet = SimpleNamespace()
    session = AsyncMock()

    class SessionContext:
        async def __aenter__(self):
            return session

        async def __aexit__(self, *args):
            return False

    class Sender:
        async def send_appointment_reminder(self, appointment, client, pet):
            return None

    calls = []

    async def get_due_reminders(self, starts_at, ends_at, excluded_ids):
        calls.append((starts_at, ends_at, excluded_ids))
        if len(calls) == 1:
            return [(appointment, client, pet)]
        return []

    monkeypatch.setattr(
        "app.services.turno_reminder_service.TurnoRepository.get_due_reminders",
        get_due_reminders,
    )

    sent = await send_due_appointment_reminders(
        SessionContext,
        Sender(),
        now=now,
    )

    assert sent == 1
    assert appointment.recordatorio_enviado is True
    assert calls[0][0] == now + timedelta(hours=24)
    assert calls[0][1] == now + timedelta(hours=24, minutes=10)
    session.commit.assert_awaited_once()
