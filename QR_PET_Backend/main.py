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

# 1. Definimos el Lifespan PRIMERO para que esté disponible al crear la app
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja eventos de inicio y cierre de la aplicación"""
    # Startup
    logger.info("Iniciando aplicación con SQLAlchemy...")
    
    yield
    
    # Shutdown
    logger.info("Cerrando aplicación...")
    await engine.dispose()
    logger.info("Conexiones de base de datos liberadas")

# 2. Función para resolver modelos de Pydantic (Lazy Resolution)
def setup_schema_rebuilds():
    """
    Resuelve referencias circulares importando dentro de la función.
    Esto evita el error 'UserResponse is not defined' en entornos como Vercel.
    """
    try:
        from app.schemas.user import UserResponse, TokenResponse
        from app.schemas.pet import PetWithOwner, PetDetailResponse
        
        models = [UserResponse, TokenResponse, PetWithOwner, PetDetailResponse]
        
        for model in models:
            model.model_rebuild()
    except Exception as e:
        logger.warning(f"Aviso: Rebuild de esquemas diferido o fallido: {e}")

# 3. Creamos la instancia de FastAPI (UNA SOLA VEZ)
app = FastAPI(
    title="PetFinder API",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# 4. Ejecutamos la reconstrucción de esquemas
setup_schema_rebuilds()

# 5. Configurar middleware y routers
setup_middleware(app)
app.include_router(v1_router)

# --- Endpoints ---

@app.get("/health")
async def health_check():
    return {"status": "ok", "orm": "sqlalchemy"}

@app.get("/")
async def root():
    return {
        "message": "Bienvenido a PetFinder API",
        "version": settings.API_VERSION,
        "docs": "/docs",
    }

# 6. Ejecución local
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )