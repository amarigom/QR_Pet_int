"""
PetFinder API - Main Application
"""


from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import app.models


from app.config import settings
from app.core.database import engine
from app.middleware import setup_middleware
from app.utils.logger import logger
from app.services.turno_reminder_scheduler import (
    run_appointment_reminder_scheduler,
    stop_reminder_scheduler,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación:
    - Conexión y desconexión de base de datos.
    """
    logger.info(" Iniciando PetFinder API con SQLAlchemy...")
    reminder_task = asyncio.create_task(run_appointment_reminder_scheduler())
    yield
    logger.info("Cerrando aplicación...")
    await stop_reminder_scheduler(reminder_task)
    await engine.dispose()
    logger.info("Conexiones de base de datos liberadas.")


def create_app() -> FastAPI:
    """
    Factory function para configurar e inicializar FastAPI.
    """
    from app.schemas.user import UserResponse
    from app.schemas.composite import PetWithOwner
    
    UserResponse.model_rebuild()
    PetWithOwner.model_rebuild()
    application = FastAPI(
        title="PetFinder API",
        version=settings.API_VERSION,
        lifespan=lifespan,
        debug=settings.DEBUG,
    )
    static_directory = settings.BASE_DIR / "static"
    static_directory.mkdir(parents=True, exist_ok=True)
    application.mount("/static", StaticFiles(directory=static_directory), name="static")

    # Configuración de Middlewares (CORS, etc.)
    setup_middleware(application)

    # Inclusión de Routers
    from app.api.v1.router import router as v1_router
    application.include_router(v1_router)

    return application


app = create_app()
