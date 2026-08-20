"""
PetFinder API - Main Application
"""
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from google import genai

from app.config import settings
from app.core.database import engine
from app.middleware import setup_middleware
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación:
    - Conexión y desconexión limpia de la base de datos SQLAlchemy.
    - Inicialización de servicios externos (Google GenAI / Groq Agent).
    """
    logger.info("Iniciando PetFinder API con SQLAlchemy...")
    
    if os.getenv("GEMINI_API_KEY"):
        logger.info("Verificando integración con Google GenAI Client...")
    else:
        logger.warning("GEMINI_API_KEY no encontrada en las variables de entorno.")

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

    # Inclusión de Routers v1 (incluye el enrutador del Agente Groq)
    from app.api.v1.router import router as v1_router
    application.include_router(v1_router)

    return application


app = create_app()

# Inicialización global del cliente Google GenAI
ai_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
    
# Endpoint de prueba para Gemini
@app.get("/test-gemini")
def test_gemini(prompt: str = "Dame un saludo corto para un perro llamado Toby"):
    try:
        response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return {
            "status": "success",
            "prompt": prompt,
            "respuesta": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
        
# Endpoint de prueba para Embeddings con gemini-embedding-2
@app.post("/test-embedding")
def test_embedding(texto: str = "Un perro labrador de color dorado", metadata: dict| None=None,):
    try:
        response = ai_client.models.embed_content(
            model="gemini-embedding-2",
            contents=texto,
        )
        
        # Accedemos al primer elemento de la lista 'embeddings'
        vector = response.embeddings[0].values
        
        return {
            "status": "success",
            "modelo_usado": "gemini-embedding-2",
            "texto_original": texto,
            "dimensiones": len(vector),
            "vector_ejemplo": vector[:5],
            "metadata": metadata or {},
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
        
    