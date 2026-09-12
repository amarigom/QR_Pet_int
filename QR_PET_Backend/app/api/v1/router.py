"""
Router principal que agrupa todos los endpoints v1
"""
from fastapi import APIRouter

# 1. Importamos los routers de los endpoints
from app.api.v1.endpoints import scans
from app.api.v1.endpoints import auth, pets, qr, admin,maps,dashboards,conocimiento,pgvector


router = APIRouter(prefix="/api/v1")

router.include_router(
    pgvector.router, prefix="/vectors", tags=["pgvector & Vector Search"]
)
router.include_router(
    conocimiento.router, prefix="/conocimiento", tags=["Base de Conocimiento"]
)

# 2. Inclusión de rutas
# El orden aquí no afecta la circularidad, pero sí la organización en el Swagger
router.include_router(auth.router)
router.include_router(pets.router)
router.include_router(maps.router, prefix="/maps", tags=["maps"])
router.include_router(qr.router)
router.include_router(scans.router)
router.include_router(admin.router)
router.include_router(dashboards.router, prefix="/dashboard", tags=["Dashboard"])