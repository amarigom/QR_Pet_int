"""
PetFinder API - Main Application
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI


from app.config import settings
from app.core.database import engine
from app.middleware import setup_middleware
from app.utils.logger import logger



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación:
    - Conexión y desconexión de base de datos.
    """
    logger.info(" Iniciando PetFinder API con SQLAlchemy...")
    yield
    logger.info("Cerrando aplicación...")
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

    # Configuración de Middlewares (CORS, etc.)
    setup_middleware(application)

    # Inclusión de Routers
    from app.api.v1.router import router as v1_router
    application.include_router(v1_router)

    return application


app = create_app()

from fastapi.middleware.cors import CORSMiddleware
# ... después de app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/health", tags=["Health"])
async def health_check():
    try:
        # Intentamos una consulta simple
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)} # Esto nos va a mostrar el error real en pantalla
    #return {"status": "ok", "orm": "sqlalchemy", "version": settings.API_VERSION}


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Bienvenido a PetFinder API",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )