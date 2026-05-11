import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Esquemas
from app.schemas.common import SuccessResponse
from app.schemas.user import UserResponse, DashboardStats
from app.schemas.composite import PetDetailResponse

# 2. Core y Seguridad (Importamos las dependencias necesarias)
from app.core.database import get_db
from ..dependencies import get_admin_service, require_admin
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Administración"])

@router.get("/users", response_model=Dict[str, Any])
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_all_users(page, limit)

@router.delete("/users/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: uuid.UUID,
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    # Nota: Asegúrate de que admin sea el objeto usuario o un dict con 'id'
    admin_id = admin.id if hasattr(admin, 'id') else admin["id"]
    await service.delete_user(admin_id, user_id)
    return SuccessResponse(message="Usuario eliminado correctamente")

@router.post("/users/{user_id}/toggle-admin", response_model=UserResponse)
async def toggle_admin_role(
    user_id: uuid.UUID, 
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    admin_id = admin.id if hasattr(admin, 'id') else admin["id"]
    return await service.toggle_admin_role(admin_id, user_id)

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_dashboard_stats()

@router.get("/pets", response_model=Dict[str, Any])
async def get_all_pets(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_all_pets(page, limit)

@router.get("/scans/heatmap", response_model=List[Dict[str, float]])
async def get_admin_heatmap(
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    """
    Endpoint para obtener coordenadas del mapa de calor.
    Solo accesible para administradores.
    """
    return await service.get_heatmap_data()

@router.get("/pets/{pet_id}", response_model=PetDetailResponse)
async def admin_get_pet_detail(
    pet_id: uuid.UUID,
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    """Inspección profunda usando la vista compuesta"""
    return await service.get_pet_detail_admin(pet_id)

