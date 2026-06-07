# 📂 app/crud/crud_dashboard.py o app/repository/dashboard.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.pet import Pet
from app.models.qr import QRCode

class DashboardRepository:
    """Clase base para repositorios con control de sesión externo"""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_dashboard_data(db, usuario_id: int) -> dict:
        """Accede directamente a la base de datos para compilar las métricas y listados."""
        
        # Conteo de mascotas usando el campo correcto: usuario_id
        pets_count_query = select(func.count(Pet.id)).where(Pet.usuario_id == usuario_id)
        total_pets = (await db.session.execute(pets_count_query)).scalar() or 0

        # Conteo de QRs activos haciendo join
        qrs_count_query = (
            select(func.count(QRCode.id))
            .join(Pet, QRCode.mascota_id == Pet.id)
            .where(Pet.usuario_id == usuario_id, QRCode.activo == True)
        )
        active_qrs = (await db.session.execute(qrs_count_query)).scalar() or 0

        # Listado de entidades mascota
        pets_query = select(Pet).where(Pet.usuario_id == usuario_id)
        result = await db.session.execute(pets_query)
        pets_list = result.scalars().all()

        return {
            "total_pets": total_pets,
            "active_qrs": active_qrs,
            "pets": pets_list
        }