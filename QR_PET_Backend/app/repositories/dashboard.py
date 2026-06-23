# 📂 app/crud/crud_dashboard.py o app/repository/dashboard.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.pet import Pet
from app.models.qr import QRCode
import uuid

from datetime import datetime, timedelta
from uuid import UUID  # Si usás UUIDs, cambialo en el tipado; si no, dejá int
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet
from app.models.qr import QRCode
from app.models.scan import Scan


class DashboardRepository:
    """Clase base para repositorios con control de sesión externo"""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_dashboard_data(self, usuario_id: uuid.UUID) -> dict:
        """Accede directamente a la base de datos para compilar las métricas y listados."""
        
        # 1. Traemos la lista de mascotas (que por el lazy="joined" ya vienen con su qr_code adentro)
        pets_query = select(Pet).where(Pet.usuario_id == usuario_id)
        result = await self.session.execute(pets_query)
        pets_list = result.scalars().all()

        # 2. Calculamos las métricas usando la lista que ya tenemos en memoria
        total_pets = len(pets_list)
        
        # 🎯 Sumatoria en memoria: Contamos cuántas mascotas tienen un qr_code y está activo=True
        active_qrs = sum(
            1 for p in pets_list 
            if p.qr_code is not None and p.qr_code.activo is True
        )

        # 3. Mantenemos el conteo de los escaneos (estos sí van separados)
        total_scans_query = (
            select(func.count(Scan.id))
            .join(QRCode, QRCode.id == Scan.qr_id)
            .join(Pet, Pet.id == QRCode.mascota_id)
            .where(Pet.usuario_id == usuario_id)
        )
        total_scans = (await self.session.execute(total_scans_query)).scalar() or 0

        hace_30_dias = datetime.utcnow() - timedelta(days=30)
        scans_30_days_query = total_scans_query.where(Scan.created_at >= hace_30_dias)
        scans_last_30_days = (await self.session.execute(scans_30_days_query)).scalar() or 0

        return {
            "total_pets": total_pets,
            "active_qrs": active_qrs,
            "total_scans": total_scans,
            "scans_last_30_days": scans_last_30_days,
            "pets": pets_list
        }

    async def get_admin_dashboard_data(self) -> dict:
        """Compila las métricas globales para el panel de administración."""
        # 1. Total histórico global de escaneos en el sistema
        total_scans_query = select(func.count(Scan.id))
        total_scans = (await self.session.execute(total_scans_query)).scalar() or 0

        # 2. Total global de escaneos en los últimos 30 días
        hace_30_dias = datetime.utcnow() - timedelta(days=30)
        scans_30_days_query = select(func.count(Scan.id)).where(Scan.created_at >= hace_30_dias)
        scans_last_30_days = (await self.session.execute(scans_30_days_query)).scalar() or 0

        # 3. Totales generales de la plataforma
        total_pets_query = select(func.count(Pet.id))
        total_pets = (await self.session.execute(total_pets_query)).scalar() or 0

        total_qrs_query = select(func.count(QRCode.id))
        total_qrs = (await self.session.execute(total_qrs_query)).scalar() or 0

        return {
            "total_scans": total_scans,
            "scans_last_30_days": scans_last_30_days,
            "total_pets": total_pets,
            "total_qrs": total_qrs
        }