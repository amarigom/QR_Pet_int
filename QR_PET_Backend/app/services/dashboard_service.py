
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.dashboard import DashboardRepository 
from app.repositories.scan_repository import ScanRepository
# O tu clase repositorio

import uuid

class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.dashboard_repo = DashboardRepository(db)
        self.scan_repo = ScanRepository(db)  # Ahora sí lo usamos correctamente

    async def get_user_dashboard_summary(self, usuario_id: uuid.UUID) -> dict:
        # 1. Traemos los datos del repositorio
        raw_data = await self.dashboard_repo.get_user_dashboard_data(usuario_id)
        
        # 2. Armamos el nodo summary
        summary_data = {
            "total_pets": raw_data["total_pets"],
            "active_qrs": raw_data["active_qrs"],
            "total_scans": raw_data["total_scans"],
            "scans_last_30_days": raw_data["scans_last_30_days"]
        }
        
        # 3. Procesamos las mascotas a PetResponse
        from app.schemas.pet import PetResponse
        clean_pets = []
        for p in raw_data["pets"]:
            clean_pets.append(PetResponse.model_validate(p))

        # 4. 🚀 PROCESAMIENTO ANALÍTICO DE ESCANEOS RECIENTES
        # Extraemos los escaneos y los transformamos para cumplir 1:1 con ScanResponse
        from app.schemas.scan import ScanResponse  
        
        scans_for_map = []
        # Buscamos bajo la llave que use tu repositorio (sea 'recent_scans' o similar)
        raw_scans = raw_data.get("recent_scans", [])
        
        for s in raw_scans:
            # Extraemos de manera segura el código del QR usando la relación 'qr' del modelo Scan
            codigo_qr = s.qr.codigo if (s.qr and hasattr(s.qr, 'codigo')) else "QR Desconocido"
            
            # Buscamos el nombre de la mascota navegando Scan -> qr -> mascota (o pet, según tu modelo)
            # Nota: Si tu relación en QRCode se llama 'mascota', esto lo resuelve perfecto.
            nombre_mascota = "Mascota"
            if s.qr and hasattr(s.qr, 'mascota') and s.qr.mascota:
                nombre_mascota = s.qr.mascota.nombre

            
            scan_dict = {
                "id": str(s.id),  # Forzado a string para el soporte Next.js en frontend
                "qr_codigo": codigo_qr,
                "created_at": s.created_at,
                "latitud": s.latitud,
                "longitud": s.longitud,
                "direccion_aproximada": s.direccion_aproximada or "Ubicación aproximada",
                "pet_name": nombre_mascota
            }
            
            
            scans_for_map.append(ScanResponse.model_validate(scan_dict))

        
        return {
            "summary": summary_data,
            "pets": clean_pets,
            "recent_scans": scans_for_map  
        }
    async def get_admin_dashboard_summary(self) -> dict:
        """Estructura las métricas globales para el administrador."""
        raw_data = await self.dashboard_repo.get_admin_dashboard_data()
        
        return {
            "summary": {
                "total_scans": raw_data["total_scans"],
                "scans_last_30_days": raw_data["scans_last_30_days"],
                "total_pets": raw_data["total_pets"],
                "total_qrs": raw_data["total_qrs"]
            }
        }