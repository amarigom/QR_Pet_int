import re
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import settings
from app.repositories.turno_repository import TurnoRepository
from app.utils.logger import logger


def _raise_for_whatsapp_response(response) -> None:
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        try:
            error_body = error.response.json()
        except ValueError:
            raise error
        details = error_body.get("error") if isinstance(error_body, dict) else None
        if not isinstance(details, dict) or not isinstance(details.get("message"), str):
            raise
        error_code = details.get("code")
        code_text = f" (código {error_code})" if error_code is not None else ""
        raise RuntimeError(
            f"WhatsApp Cloud API rechazó el mensaje{code_text}: {details['message']}"
        ) from error


class WhatsAppCloudSender:
    @property
    def is_configured(self) -> bool:
        return bool(settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)

    async def send_appointment_reminder(self, appointment, client, pet) -> None:
        if not self.is_configured:
            raise RuntimeError("WhatsApp Cloud API no está configurada.")
        if not client.whatsapp_recordatorios_consent:
            raise ValueError("El cliente no autorizó recordatorios por WhatsApp.")
        if not client.telefono:
            raise ValueError(f"El cliente {client.id} no tiene teléfono registrado.")

        phone = re.sub(r"\D", "", client.telefono)
        if not 10 <= len(phone) <= 15:
            raise ValueError(f"El teléfono del cliente {client.id} no tiene formato internacional.")

        appointment_start = appointment.fecha_hora_inicio
        appointment_utc = (
            appointment_start.replace(tzinfo=timezone.utc)
            if appointment_start.tzinfo is None
            else appointment_start.astimezone(timezone.utc)
        )
        appointment_local = appointment_utc.astimezone(ZoneInfo(settings.REMINDER_TIMEZONE))
        parameters = [
            client.nombre,
            pet.nombre,
            appointment_local.strftime("%d/%m/%Y"),
            appointment_local.strftime("%H:%M"),
            appointment.tipo_servicio,
        ]
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "template",
            "template": {
                "name": settings.WHATSAPP_TEMPLATE_NAME,
                "language": {"code": settings.WHATSAPP_TEMPLATE_LANGUAGE},
                "components": [{
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": value}
                        for value in parameters
                    ],
                }],
            },
        }

        url = (
            f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/"
            f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        )
        async with httpx.AsyncClient(timeout=15) as client_session:
            response = await client_session.post(
                url,
                headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
                json=payload,
            )
            _raise_for_whatsapp_response(response)

    async def send_account_activation(self, phone: str, client_name: str, activation_url: str) -> None:
        if not self.is_configured:
            raise RuntimeError("WhatsApp Cloud API no está configurada.")
        normalized_phone = re.sub(r"\D", "", phone)
        if not 10 <= len(normalized_phone) <= 15:
            raise ValueError("El teléfono del cliente no tiene formato internacional.")

        payload = {
            "messaging_product": "whatsapp",
            "to": normalized_phone,
            "type": "template",
            "template": {
                "name": settings.WHATSAPP_ACTIVATION_TEMPLATE_NAME,
                "language": {"code": settings.WHATSAPP_TEMPLATE_LANGUAGE},
                "components": [{
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": client_name},
                        {"type": "text", "text": activation_url},
                    ],
                }],
            },
        }
        url = (
            f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/"
            f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        )
        async with httpx.AsyncClient(timeout=15) as client_session:
            response = await client_session.post(
                url,
                headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
                json=payload,
            )
            _raise_for_whatsapp_response(response)


async def send_due_appointment_reminders(
    session_factory: async_sessionmaker,
    sender: WhatsAppCloudSender | None = None,
    now: datetime | None = None,
) -> int:
    sender = sender or WhatsAppCloudSender()
    current_time = now or datetime.now(timezone.utc).replace(tzinfo=None)
    reminder_due_at = current_time + timedelta(hours=24)
    due_before = reminder_due_at + timedelta(minutes=10)
    excluded_ids: list[uuid.UUID] = []
    sent_count = 0

    while True:
        async with session_factory() as session:
            repository = TurnoRepository(session)
            due = await repository.get_due_reminders(
                reminder_due_at,
                due_before,
                excluded_ids,
            )
            if not due:
                return sent_count

            appointment, client, pet = due[0]
            appointment_id = appointment.id
            try:
                await sender.send_appointment_reminder(appointment, client, pet)
                appointment.recordatorio_enviado = True
                await session.commit()
                sent_count += 1
            except Exception:
                await session.rollback()
                logger.exception(
                    "No se pudo enviar el recordatorio de WhatsApp del turno %s",
                    appointment_id,
                )
                excluded_ids.append(appointment_id)
