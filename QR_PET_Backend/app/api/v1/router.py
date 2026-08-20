"""
Router principal que agrupa todos los endpoints v1
"""
from fastapi import APIRouter

# Importación organizada de todos los módulos de endpoints
from app.api.v1.endpoints import (
    admin,
    agent,
    auth,
    chroma,
    dashboards,
    maps,
    pets,
    qr,
    scans,
    chat,
    conocimiento,
)

router = APIRouter(prefix="/api/v1")

# Inclusión de rutas
router.include_router(chroma.router, prefix="/chroma", tags=["ChromaDB & Vector Search"])
router.include_router(auth.router)
router.include_router(pets.router)
router.include_router(maps.router, prefix="/maps", tags=["maps"])
router.include_router(qr.router)
router.include_router(scans.router)
router.include_router(admin.router)
router.include_router(dashboards.router, prefix="/dashboard", tags=["Dashboard"])
router.include_router(agent.router, prefix="/agente", tags=["Agente IA"])
router.include_router(chat.router, prefix="/chatbot", tags=["Chatbot RAG"])
router.include_router(conocimiento.router, prefix="/conocimiento", tags=["Base de Conocimiento"])