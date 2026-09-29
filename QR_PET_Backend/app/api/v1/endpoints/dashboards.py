from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.v1.dependencies import get_current_user
from app.schemas.dashboard import UserDashboardResponse, VeterinarioDashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/user", response_model=UserDashboardResponse)
async def get_user_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acceso para TODOS los usuarios autenticados (sus mascotas y escaneos)."""
    service = DashboardService(db)
    return await service.get_user_dashboard_summary(current_user.id)


@router.get("/veterinario", response_model=VeterinarioDashboardResponse)
async def get_veterinario_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acceso permitido a Veterinario y Admin."""
    rol_limpio = (current_user.rol or "").lower()
    if rol_limpio not in ["veterinario", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos de veterinario para acceder a esta vista."
        )
    
    service = DashboardService(db)
    return await service.get_veterinario_dashboard_summary(current_user.id)


@router.get("/admin")
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acceso EXCLUSIVO a Administradores."""
    rol_limpio = (current_user.rol or "").lower()
    if rol_limpio != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos de administrador para acceder a esta vista."
        )
        
    service = DashboardService(db)
    return await service.get_admin_dashboard_summary()
