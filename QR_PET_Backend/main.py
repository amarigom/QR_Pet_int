"""
Aplicación principal de FastAPI - Migrada a SQLAlchemy
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings

from app.core.database import engine 
from app.middleware import setup_middleware
from app.api.v1.router import router as v1_router
from app.utils.logger import logger
from app.schemas.user import UserResponse, TokenResponse
from app.schemas.pet import PetWithOwner, PetDetailResponse

def setup_schema_rebuilds():
    models = [
        UserResponse, 
        TokenResponse, 
        PetWithOwner, 
        PetDetailResponse
    ]
    for model in models:
        try:
            model.model_rebuild()
        except Exception as e:
            print(f"Aviso: No se pudo reconstruir {model.__name__}: {e}")

# Ejecutamos antes de crear la app
setup_schema_rebuilds()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja eventos de inicio y cierre de la aplicación"""
    # Startup
    logger.info("Iniciando aplicación con SQLAlchemy...")
    
    # Opcional: Crear tablas automáticamente si no usas Alembic
    # async with engine.begin() as conn:
    #     from app.models.user import User
    #     from app.models.pet import Pet
    #     from app.models.base import Base
    #     await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown
    logger.info("Cerrando aplicación...")
    # SQLAlchemy cierra el engine automáticamente, pero podemos forzar la limpieza
    await engine.dispose()
    logger.info("Conexiones de base de datos liberadas")


app = FastAPI(
    title="PetFinder API",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# Configurar middleware
setup_middleware(app)

# Incluir routers
app.include_router(v1_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "orm": "sqlalchemy"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Bienvenido a PetFinder API",
        "version": settings.API_VERSION,
        "docs": "/docs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", # <-- Cambia "app.main:app" por "main:app" si el archivo está en la raíz del Backend
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )