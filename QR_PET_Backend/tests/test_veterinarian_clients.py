import hashlib
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.config import settings
from app.core.auth import verify_password
from app.models.user import User
from app.schemas.veterinario import VeterinarianClientCreate
from app.services.veterinarian_client_service import VeterinarianClientService


@pytest.mark.asyncio
async def test_veterinarian_creates_client_and_sends_one_time_activation_link():
    clinic = SimpleNamespace(
        user_id=uuid4(),
        activo=True,
    )
    veterinarian = SimpleNamespace(id=clinic.user_id)
    db = AsyncMock()
    db.add = Mock()
    db.execute.return_value = SimpleNamespace(scalar_one_or_none=lambda: clinic)
    service = VeterinarianClientService(db)
    service.user_repository.email_exists = AsyncMock(return_value=False)
    sender = AsyncMock()

    result = await service.create_client(
        VeterinarianClientCreate(
            nombre="Ana Ejemplo",
            email="ANA@example.com",
            telefono="+5492494112233",
        ),
        veterinarian,
        sender,
    )

    client = db.add.call_args.args[0]
    assert isinstance(client, User)
    assert client.email == "ana@example.com"
    assert client.rol == "usuario"
    assert client.pending_activation is True
    assert result["whatsapp_sent"] is True
    assert result["activation_url"] is None
    sender.send_account_activation.assert_awaited_once()
    activation_url = sender.send_account_activation.await_args.args[2]
    token = activation_url.split("token=")[-1]
    assert hashlib.sha256(token.encode()).hexdigest() == client.activation_token_hash
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_client_is_created_with_manual_activation_link_when_whatsapp_fails():
    clinic = SimpleNamespace(user_id=uuid4(), activo=True)
    db = AsyncMock()
    db.add = Mock()
    db.execute.return_value = SimpleNamespace(scalar_one_or_none=lambda: clinic)
    service = VeterinarianClientService(db)
    service.user_repository.email_exists = AsyncMock(return_value=False)
    sender = AsyncMock()
    sender.send_account_activation.side_effect = RuntimeError("provider unavailable")

    result = await service.create_client(
        VeterinarianClientCreate(
            nombre="Ana Ejemplo",
            email="ana@example.com",
            telefono="+5492494112233",
        ),
        SimpleNamespace(id=clinic.user_id),
        sender,
    )

    assert result["whatsapp_sent"] is False
    assert result["activation_url"].startswith(
        f"{settings.FRONTEND_URL.rstrip('/')}/auth/activate?token="
    )
    assert db.add.call_args.args[0].pending_activation is True
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_activation_sets_private_password_and_invalidates_one_time_token():
    token = "valid-one-time-token"
    user = User(
        email="ana@example.test",
        nombre="Ana Ejemplo",
        telefono="+5492494112233",
        password_hash="unused",
        rol="usuario",
        pending_activation=True,
        activation_token_hash=hashlib.sha256(token.encode()).hexdigest(),
        activation_token_expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
        + timedelta(hours=1),
    )
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(scalar_one_or_none=lambda: user)

    activated = await VeterinarianClientService(db).activate_account(
        token,
        "private-password-123",
    )

    assert activated.pending_activation is False
    assert activated.activation_token_hash is None
    assert activated.activation_token_expires_at is None
    assert verify_password("private-password-123", activated.password_hash)
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_activation_rejects_expired_tokens():
    user = User(
        email="ana@example.test",
        nombre="Ana Ejemplo",
        telefono="+5492494112233",
        password_hash="unused",
        rol="usuario",
        pending_activation=True,
        activation_token_hash=hashlib.sha256(b"expired-token").hexdigest(),
        activation_token_expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
        - timedelta(seconds=1),
    )
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(scalar_one_or_none=lambda: user)

    with pytest.raises(HTTPException) as error:
        await VeterinarianClientService(db).activate_account(
            "expired-token",
            "private-password-123",
        )

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_veterinarian_can_regenerate_activation_for_pending_linked_client():
    token_hash = "previous-token-hash"
    client = User(
        id=uuid4(),
        email="ana@example.test",
        nombre="Ana Ejemplo",
        telefono="+5492494112233",
        password_hash="unused",
        rol="usuario",
        pending_activation=True,
        activation_token_hash=token_hash,
        activation_token_expires_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    veterinarian = SimpleNamespace(id=uuid4())
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(scalar_one_or_none=lambda: client)
    sender = AsyncMock()

    result = await VeterinarianClientService(db).resend_activation(
        client.id,
        veterinarian,
        sender,
    )

    activation_url = sender.send_account_activation.await_args.args[2]
    token = activation_url.split("token=")[-1]
    assert result["whatsapp_sent"] is True
    assert result["activation_url"] is None
    assert client.activation_token_hash != token_hash
    assert hashlib.sha256(token.encode()).hexdigest() == client.activation_token_hash
    assert client.activation_token_expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit.assert_awaited_once()
