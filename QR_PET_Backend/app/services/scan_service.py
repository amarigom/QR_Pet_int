import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.scan_repository import ScanRepository
from app.repositories.qr_repository import QRRepository
from app.core.exceptions import ResourceNotFoundException
from app.schemas.scan import ScanCreate, ScanResponse

class ScanService:
    """Service para gestionar el registro y consulta de escaneos"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.scan_repo = ScanRepository(db)
        self.qr_repo = QRRepository(db)
    
    async def create_scan(self, scan_data: ScanCreate) -> Dict[str, Any]:
        """
        Registra un nuevo escaneo a partir del código de un QR.
        Este es el punto de entrada cuando alguien escanea una placa.
        """
        # 1. Buscar el QR por el código (string) que viene del escaneo
        qr = await self.qr_repo.get_by_code(scan_data.codigo)
        if not qr:
            raise ResourceNotFoundException("Código QR", "El código escaneado no existe")
        
        # 2. Crear el registro de escaneo
        # Usamos model_dump para pasar latitud, longitud, etc.
        scan = await self.scan_repo.create(
            qr_id=qr.id,
            **scan_data.model_dump(exclude={"codigo"})
        )
        
        # 3. Confirmar transacción
        await self.db.commit()
        await self.db.refresh(scan)
        
        # 4. (Opcional) Aquí es donde dispararías una tarea Celery para enviar un Email/Push al dueño
        
        return {
            "success": True,
            "message": "Escaneo registrado. El dueño será notificado.",
            "scan": ScanResponse.model_validate(scan)
        }
    
    async def get_pet_scans(self, pet_id: uuid.UUID, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Obtiene el historial de escaneos de una mascota específica"""
        offset = (page - 1) * limit
        
        # El repo ya hace el join necesario para filtrar por mascota_id
        scans = await self.scan_repo.get_by_mascota(pet_id, limit, offset)
        
        # Para el conteo, necesitamos el QR asociado a esa mascota
        qr = await self.qr_repo.get_by_mascota(pet_id)
        total = await self.scan_repo.count_by_qr(qr.id) if qr else 0
        
        return {
            "items": [ScanResponse.model_validate(s) for s in scans],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    
    async def get_all_scans(self, page: int = 1, limit: int = 100) -> Dict[str, Any]:
        """Listado administrativo global de escaneos con detalles de mascota"""
        offset = (page - 1) * limit
        scans = await self.scan_repo.get_all_with_details(limit, offset)
        total = await self.scan_repo.count()
        
        return {
            "items": [
                {
                    "id": str(s.id),
                    "qr_codigo": s.qr.codigo if s.qr else "N/A",
                    "mascota": s.qr.mascota.nombre if s.qr and s.qr.mascota else "Sin asignar",
                    "fecha": s.created_at,
                    "ubicacion": s.direccion_aproximada,
                    "coordenadas": f"{s.latitud}, {s.longitud}" if s.latitud else "No proporcionada"
                } for s in scans
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }