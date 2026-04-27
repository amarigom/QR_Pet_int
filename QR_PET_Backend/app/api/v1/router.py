"""
Router principal que agrupa todos los endpoints v1
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, pets, qr, scan, admin

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(pets.router)
router.include_router(qr.router)
router.include_router(scan.router)
router.include_router(admin.router)
