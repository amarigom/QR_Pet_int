# 📂 app/services/dashboard.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.dashboard import DashboardRepository  # O tu clase repositorio

class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dashboard_repo = DashboardRepository(db) # O tu clase repositorio

    async def get_user_dashboard_summary(self, usuario_id: int) -> dict:
        # Acudimos al repositorio para buscar los datos crudos
        raw_data = await self.dashboard_repo.get_user_dashboard_data( usuario_id)
        
        # Estructuramos la respuesta final separando el summary del listado
        return {
            "summary": {
                "total_pets": raw_data["total_pets"],
                "active_qrs": raw_data["active_qrs"]
            },
            "pets": raw_data["pets"]
        }