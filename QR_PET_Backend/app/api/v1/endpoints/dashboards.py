from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from app.core.database import get_db
from app.models.user import User
from app.models.pet import Pet
from app.models.qr import QRCode # Ajustá a tus modelos reales
from app.api.v1.dependencies import get_current_user
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.dashboard import UserDashboardResponse
from app.services.dashboard_service import DashboardService


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/user", response_model=UserDashboardResponse)
async def get_user_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = DashboardService(db)
    return await service.get_user_dashboard_summary(current_user.id)