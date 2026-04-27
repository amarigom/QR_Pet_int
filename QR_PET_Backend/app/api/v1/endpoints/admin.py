import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

# Esquemas
from app.schemas.user import UserResponse, DashboardStats
from app.schemas.common import SuccessResponse

# Core y Seguridad
from app.services.admin_service import AdminService
from app.api.v1.dependencies import require_admin
from app.core.database import get_db

router = APIRouter(prefix="/admin", tags=["Administración"])

@router.get("/users", response_model=Dict[str, Any])
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene listado global de usuarios (Solo Admin)"""
    service = AdminService(db)
    return await service.get_all_users(page, limit)


@router.delete("/users/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: uuid.UUID, # Tipado nativo para validación automática
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Elimina cualquier usuario del sistema"""
    service = AdminService(db)
    # admin["id"] ya viene como UUID de la dependencia require_admin
    await service.delete_user(admin["id"], user_id)
    return SuccessResponse(message="Usuario eliminado correctamente")


@router.post("/users/{user_id}/toggle-admin", response_model=UserResponse)
async def toggle_admin_role(
    user_id: uuid.UUID, 
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Alterna el rol de administrador de un usuario"""
    service = AdminService(db)
    return await service.toggle_admin_role(admin["id"], user_id)


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Estadísticas globales para el Dashboard administrativo"""
    service = AdminService(db)
    return await service.get_dashboard_stats()


@router.get("/pets", response_model=Dict[str, Any])
async def get_all_pets(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Listado global de mascotas con carga de dueños (JOIN optimizado)"""
    service = AdminService(db)
    return await service.get_all_pets(page, limit)


@router.get("/pets/{pet_id}", response_model=Dict[str, Any])
async def admin_get_pet_detail(
    pet_id: uuid.UUID,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Inspección profunda de una mascota (incluye datos de QR y propietario)"""
    service = AdminService(db)
    return await service.get_pet_detail_admin(pet_id)