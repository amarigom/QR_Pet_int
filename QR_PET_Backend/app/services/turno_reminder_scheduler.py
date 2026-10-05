import asyncio
from contextlib import suppress

from app.core.database import AsyncSessionLocal
from app.services.turno_reminder_service import (
    WhatsAppCloudSender,
    send_due_appointment_reminders,
)
from app.utils.logger import logger

REMINDER_INTERVAL_SECONDS = 5 * 60


async def run_appointment_reminder_scheduler() -> None:
    sender = WhatsAppCloudSender()
    if not sender.is_configured:
        logger.warning(
            "Recordatorios automáticos desactivados: configure "
            "WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID para habilitarlos."
        )
        return

    logger.info("Scheduler de recordatorios de turnos iniciado.")
    while True:
        try:
            count = await send_due_appointment_reminders(AsyncSessionLocal, sender)
            if count:
                logger.info("Se enviaron %s recordatorios de turnos por WhatsApp.", count)
        except Exception:
            logger.exception("Falló la ejecución del scheduler de recordatorios.")
        await asyncio.sleep(REMINDER_INTERVAL_SECONDS)


async def stop_reminder_scheduler(task: asyncio.Task) -> None:
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
