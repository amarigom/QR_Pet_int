import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from fastapi import HTTPException, status
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import hash_password
from app.core.exceptions import ConflictException, ResourceNotFoundException
from app.models.user import User
from app.models.veterinario import PerfilVeterinario
from app.models.veterinario_cliente import veterinario_clientes
from app.repositories.user_repository import UserRepository
from app.schemas.veterinario import VeterinarianClientCreate
from app.services.turno_reminder_service import WhatsAppCloudSender
from app.utils.logger import logger


class VeterinarianClientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repository = UserRepository(db)

    async def create_client(
        self,
        data: VeterinarianClientCreate,
        veterinarian: User,
        sender: WhatsAppCloudSender | None = None,
    ) -> dict:
        clinic_result = await self.db.execute(
            select(PerfilVeterinario).where(
                PerfilVeterinario.user_id == veterinarian.id,
                PerfilVeterinario.activo.is_(True),
            )
        )
        clinic = clinic_result.scalar_one_or_none()
        if clinic is None:
            raise ResourceNotFoundException(
                "Perfil veterinario",
                detail="Completá el perfil de tu veterinaria antes de registrar clientes.",
            )
        email = str(data.email).lower()
        if await self.user_repository.email_exists(email):
            raise ConflictException("Ya existe una cuenta con ese correo electrónico.")

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=48)
        client = User(
            email=email,
            nombre=data.nombre.strip(),
            telefono=data.telefono,
            password_hash=hash_password(secrets.token_urlsafe(48)),
            rol="usuario",
            pending_activation=True,
            activation_token_hash=token_hash,
            activation_token_expires_at=expires_at,
            whatsapp_recordatorios_consent=False,
        )
        self.db.add(client)
        await self.db.flush()
        await self.db.execute(
            insert(veterinario_clientes).values(
                veterinario_id=veterinarian.id,
                cliente_id=client.id,
            )
        )
        await self.db.commit()
        await self.db.refresh(client)

        return await self._send_activation_link(client, token, sender)

    async def resend_activation(
        self,
        client_id: uuid.UUID,
        veterinarian: User,
        sender: WhatsAppCloudSender | None = None,
    ) -> dict:
        result = await self.db.execute(
            select(User)
            .join(veterinario_clientes, veterinario_clientes.c.cliente_id == User.id)
            .where(
                veterinario_clientes.c.veterinario_id == veterinarian.id,
                User.id == client_id,
                User.pending_activation.is_(True),
            )
        )
        client = result.scalar_one_or_none()
        if client is None:
            raise ResourceNotFoundException(
                "Cliente pendiente de activación",
                detail="No se encontró un cliente pendiente vinculado a tu veterinaria.",
            )

        token = secrets.token_urlsafe(32)
        client.activation_token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        client.activation_token_expires_at = (
            datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=48)
        )
        await self.db.commit()
        await self.db.refresh(client)
        return await self._send_activation_link(client, token, sender)

    async def _send_activation_link(
        self,
        client: User,
        token: str,
        sender: WhatsAppCloudSender | None,
    ) -> dict:
        activation_url = (
            f"{settings.FRONTEND_URL.rstrip('/')}/auth/activate?"
            f"{urlencode({'token': token})}"
        )
        sender = sender or WhatsAppCloudSender()
        try:
            await sender.send_account_activation(
                client.telefono,
                client.nombre,
                activation_url,
            )
        except Exception as error:
            logger.exception(
                "Se creó el cliente %s, pero no se pudo enviar su activación por WhatsApp.",
                client.id,
            )
            return {
                "id": client.id,
                "nombre": client.nombre,
                "email": client.email,
                "whatsapp_sent": False,
                "activation_url": activation_url,
                "whatsapp_error": str(error),
                "message": (
                    "No se pudo enviar WhatsApp; copiá el enlace para compartirlo manualmente."
                ),
            }

        return {
            "id": client.id,
            "nombre": client.nombre,
            "email": client.email,
            "whatsapp_sent": True,
            "activation_url": None,
            "whatsapp_error": None,
            "message": "Cuenta creada y enlace de activación enviado por WhatsApp.",
        }

    async def activate_account(
        self,
        token: str,
        password: str,
    ) -> User:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        result = await self.db.execute(
            select(User).where(
                User.activation_token_hash == token_hash,
                User.pending_activation.is_(True),
            )
        )
        user = result.scalar_one_or_none()
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if (
            user is None
            or user.activation_token_expires_at is None
            or user.activation_token_expires_at <= now
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El enlace de activación es inválido o venció. Pedile al veterinario uno nuevo.",
            )

        user.password_hash = hash_password(password)
        user.pending_activation = False
        user.activation_token_hash = None
        user.activation_token_expires_at = None
        await self.db.commit()
        await self.db.refresh(user)
        return user
