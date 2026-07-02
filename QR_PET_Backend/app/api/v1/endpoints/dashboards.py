from fastapi import APIRouter, Depends,HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User
from app.models.pet import Pet
from app.models.qr import QRCode 
from app.api.v1.dependencies import get_current_user
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.dashboard import UserDashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()



@router.get("/user", response_model=UserDashboardResponse)
async def get_user_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Next.js pega acá para el usuario común"""
    service = DashboardService(db)
    return await service.get_user_dashboard_summary(current_user.id)


@router.get("/admin")
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Next.js pega acá para el admin"""
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permisos para acceder a las estadísticas globales."
        )
        
    service = DashboardService(db)
    return await service.get_admin_dashboard_summary()

