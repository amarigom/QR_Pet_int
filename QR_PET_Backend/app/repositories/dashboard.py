# 📂 app/crud/crud_dashboard.py o app/repository/dashboard.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.pet import Pet
from app.models.qr import QRCode
from app.schemas.scan import ScanResponse
import uuid

from datetime import datetime, timedelta,timezone
from uuid import UUID  # Si usás UUIDs, cambialo en el tipado; si no, dejá int
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.pet import Pet
from app.models.qr import QRCode
from app.models.scan import Scan
from typing import Dict, Any

class DashboardRepository:
    """Clase base para repositorios con control de sesión externo"""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_dashboard_data(self, usuario_id: uuid.UUID) -> Dict[str, Any]:
        """
        Recopila métricas generales y genera la lista detallada de escaneos de los 
        últimos 30 días vinculados a las mascotas del usuario.
        """
        # 1. Ventana temporal naive para matchear con TIMESTAMP WITHOUT TIME ZONE
        hace_30_dias = datetime.utcnow() - timedelta(days=30)

        # 2. Obtener lista base de mascotas con sus QRs (Para métricas del panel)
        pets_query = (
            select(Pet)
            .where(Pet.usuario_id == usuario_id)
            .options(joinedload(Pet.qr_code))
        )
        pets_result = await self.session.execute(pets_query)
        pets_list = pets_result.scalars().unique().all()

        total_pets = len(pets_list)
        active_qrs = sum(1 for p in pets_list if p.qr_code is not None and p.qr_code.activo)

        # 3. 🚀 CONSULTA MAESTRA DETALLADA: Trae los escaneos de los últimos 30 días
        # de este usuario, cargando eficientemente el QR y la Mascota asociada en una sola ida a la DB.
        scans_query = (
            select(Scan)
            .join(QRCode, QRCode.id == Scan.qr_id)
            .join(Pet, Pet.id == QRCode.mascota_id)
            .where(Pet.usuario_id == usuario_id)
            .where(Scan.created_at >= hace_30_dias)
            .options(
                joinedload(Scan.qr).joinedload(QRCode.mascota)  # Anidamos la carga para el mapeo
            )
            .order_by(Scan.created_at.desc())  # Primero los más recientes
        )
        scans_result = await self.session.execute(scans_query)
        recent_scans_list = scans_result.scalars().unique().all()

        # 4. Métricas globales de escaneos para los contadores superiores
        total_scans_query = (
            select(func.count(Scan.id))
            .join(QRCode, QRCode.id == Scan.qr_id)
            .join(Pet, Pet.id == QRCode.mascota_id)
            .where(Pet.usuario_id == usuario_id)
        )
        total_scans = (await self.session.execute(total_scans_query)).scalar() or 0
        scans_last_30_days = len(recent_scans_list)

        return {
            "total_pets": total_pets,
            "active_qrs": active_qrs,
            "total_scans": total_scans,
            "scans_last_30_days": scans_last_30_days,
            "pets": pets_list,
            "recent_scans": recent_scans_list  # 🌟 Lista de objetos Scan 100% detallados y linkeados
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