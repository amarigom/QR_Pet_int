"""
Scheduler para Recordatorios Automáticos
Ejecuta tareas programadas para enviar recordatorios
"""
import asyncio
from datetime import datetime, time
from typing import Optional

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.services.reminder_service import ReminderService
from app.core.config import DATABASE_URL


class ReminderScheduler:
    """
    Scheduler para enviar recordatorios automáticamente
    Puede ejecutarse como background job o como tarea cron
    """

    def __init__(self, db_url: str = DATABASE_URL):
        self.db_url = db_url
        self.engine = None
        self.AsyncSessionLocal = None

    async def initialize(self):
        """Inicializa la conexión a BD"""
        self.engine = create_async_engine(
            self.db_url,
            echo=False,
            pool_size=10
        )
        self.AsyncSessionLocal = sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False
        )

    async def close(self):
        """Cierra conexión a BD"""
        if self.engine:
            await self.engine.dispose()

    async def run_daily(self, time_str: str = "08:00"):
        """
        Ejecuta el scheduler a una hora específica todos los días
        
        Ejemplo:
            await scheduler.run_daily("08:00")  # Ejecuta a las 8:00 AM
        """
        target_hour, target_minute = map(int, time_str.split(":"))

        while True:
            now = datetime.utcnow()
            target = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)

            # Si ya pasó la hora hoy, esperar a mañana
            if now > target:
                target = target.replace(day=target.day + 1)

            wait_seconds = (target - now).total_seconds()

            print(f"[Reminder Scheduler] Next execution: {target} (in {wait_seconds} seconds)")

            await asyncio.sleep(wait_seconds)

            # Ejecutar
            await self.send_pending_reminders()

    async def run_once(self):
        """Ejecuta el scheduler una sola vez"""
        await self.send_pending_reminders()

    async def run_interval(self, minutes: int = 30):
        """
        Ejecuta el scheduler cada N minutos
        
        Ejemplo:
            await scheduler.run_interval(30)  # Cada 30 minutos
        """
        while True:
            await self.send_pending_reminders()
            wait_seconds = minutes * 60
            print(f"[Reminder Scheduler] Next check in {minutes} minutes")
            await asyncio.sleep(wait_seconds)

    async def send_pending_reminders(self):
        """
        Envía todos los recordatorios pendientes
        Se ejecuta automáticamente por el scheduler
        """
        try:
            await self.initialize()

            async with self.AsyncSessionLocal() as session:
                reminder_service = ReminderService(session)
                result = await reminder_service.send_all_pending()

                print(f"[Reminder Scheduler] Job completed at {datetime.utcnow()}")
                print(f"  - Total pending: {result['total']}")
                print(f"  - Sent: {result['sent']}")
                print(f"  - Failed: {result['failed']}")

            await self.close()

        except Exception as e:
            print(f"[Reminder Scheduler] ERROR: {str(e)}")
            await self.close()


# Instancia global del scheduler
_scheduler_instance: Optional[ReminderScheduler] = None


def get_scheduler() -> ReminderScheduler:
    """Obtiene la instancia global del scheduler"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = ReminderScheduler()
    return _scheduler_instance


async def start_reminder_scheduler(mode: str = "interval", interval_minutes: int = 30):
    """
    Inicia el scheduler de recordatorios
    
    Modos:
    - "interval": Ejecuta cada N minutos
    - "daily": Ejecuta a una hora específica cada día
    - "once": Ejecuta una sola vez
    
    Ejemplo uso en main.py:
        import asyncio
        from app.jobs.reminder_scheduler import start_reminder_scheduler
        
        # En un background task o evento startup
        asyncio.create_task(start_reminder_scheduler(mode="interval", interval_minutes=30))
    """
    scheduler = get_scheduler()

    try:
        if mode == "interval":
            await scheduler.run_interval(interval_minutes)
        elif mode == "daily":
            await scheduler.run_daily("08:00")
        elif mode == "once":
            await scheduler.run_once()
        else:
            raise ValueError(f"Invalid mode: {mode}")
    except asyncio.CancelledError:
        print("[Reminder Scheduler] Stopped")
    except Exception as e:
        print(f"[Reminder Scheduler] FATAL ERROR: {str(e)}")
    finally:
        await scheduler.close()
