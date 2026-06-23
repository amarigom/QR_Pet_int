
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.dashboard import DashboardRepository  # O tu clase repositorio



class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dashboard_repo = DashboardRepository(db)

    async def get_user_dashboard_summary(self, usuario_id: UUID) -> dict:
        """Estructura las métricas personales del usuario separando el summary del listado."""
        # Acudimos al repositorio para buscar los datos crudos
        raw_data = await self.dashboard_repo.get_user_dashboard_data(usuario_id)
        
        # 🎯 Mantenemos tu estructura idéntica pero sumamos los nuevos contadores adentro del summary
        return {
            "summary": {
                "total_pets": raw_data["total_pets"],
                "active_qrs": raw_data["active_qrs"],
                "total_scans": raw_data["total_scans"],          # Escaneos totales del usuario
                "scans_last_30_days": raw_data["scans_last_30_days"] # Escaneos del último mes
            },
            "pets": raw_data["pets"]
        }

    async def get_admin_dashboard_summary(self) -> dict:
        """Estructura las métricas globales para el administrador."""
        raw_data = await self.dashboard_repo.get_admin_dashboard_data()
        
        # Usamos un formato similar de summary global para mantener la simetría del código
        return {
            "summary": {
                "total_scans": raw_data["total_scans"],
                "scans_last_30_days": raw_data["scans_last_30_days"],
                "total_pets": raw_data["total_pets"],
                "total_qrs": raw_data["total_qrs"]
            }
        }