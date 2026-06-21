"""
Router principal que agrupa todos los endpoints v1
"""
from fastapi import APIRouter

# 1. Importamos los routers de los endpoints
from app.api.v1.endpoints import (
    scans,
    auth,
    pets,
    qr,
    admin,
    maps,
    # Nuevos endpoints veterinarios
    veterinary_clinic,
    medical_record,
    appointment,
    reminder,
    ai_assistant,
)

router = APIRouter(prefix="/api/v1")

# 2. Inclusión de rutas
# El orden aquí no afecta la circularidad, pero sí la organización en el Swagger
router.include_router(auth.router)
router.include_router(pets.router)
router.include_router(maps.router, prefix="/maps", tags=["maps"])
router.include_router(qr.router)
router.include_router(scans.router)
router.include_router(admin.router)

# 3. Nuevos routers veterinarios
router.include_router(veterinary_clinic.router)
router.include_router(medical_record.router)
router.include_router(appointment.router)
router.include_router(reminder.router)
router.include_router(ai_assistant.router)
