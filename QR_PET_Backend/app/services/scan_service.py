import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from uuid import UUID

from app.repositories.scan_repository import ScanRepository
from app.repositories.qr_repository import QRRepository
from app.core.exceptions import ResourceNotFoundException
from app.schemas.scan import ScanCreate, ScanResponse, ScanUpdate
from app.models.scan import Scan
from app.models.pet import Pet 
from app.models.qr import QRCode

class ScanService:
    """Service para gestionar el registro y consulta de escaneos"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.scan_repo = ScanRepository(db)
        self.qr_repo = QRRepository(db)
    
    async def create_scan(self, scan_data: ScanCreate) -> Dict[str, Any]:
        """
        Registra un nuevo escaneo a partir del código de un QR.
        """
        qr = await self.qr_repo.get_by_code(scan_data.codigo)
        if not qr:
            raise ResourceNotFoundException("Código QR", "El código escaneado no existe")
        
        # Aseguramos que el id sea UUID antes de pasar al repo
        scan = await self.scan_repo.create(
            qr_id=qr.id,
            **scan_data.model_dump(exclude={"codigo"})
        )
        
        await self.db.commit()
        await self.db.refresh(scan)
        
        return {
            "success": True,
            "message": "Escaneo registrado. El dueño será notificado.",
            "scan": ScanResponse.model_validate(scan)
        }
    
    async def process_scan_from_qr(self, codigo_qr: str) -> Dict[str, Any]:
        """
        Punto de entrada para el escaneo inicial. Busca mascota y dueño.
        """
        # Consulta con Eager Loading para evitar el error 500 de Lazy Loading en Async
        stmt = (
            select(QRCode)
            .options(
                joinedload(QRCode.mascota).joinedload(Pet.owner)
            )
            .where(QRCode.codigo == codigo_qr)
        )
        
        result = await self.db.execute(stmt)
        qr = result.scalar_one_or_none()

        if not qr:
            raise ResourceNotFoundException("Código QR", "QR no encontrado")

        if not qr.mascota:
            raise ResourceNotFoundException("Mascota", "Este QR no tiene una mascota asignada")

        # Crear el registro inicial del escaneo (solo con el ID del QR)
        scan = await self.scan_repo.create(qr_id=qr.id)
        
        await self.db.commit()
        await self.db.refresh(scan)

        pet_data = qr.mascota
        owner_data = pet_data.owner

        return {
            "scan_id": str(scan.id),
            "pet": {
                "id": str(pet_data.id),
                "nombre": pet_data.nombre,
                "especie": pet_data.especie,
                "raza": pet_data.raza or "",
                "foto_url": pet_data.foto_url or "",
                "notas": pet_data.notas or "",
                "estado": pet_data.estado
            },
            "owner": {
                "nombre": owner_data.nombre if owner_data else "Dueño",
                "telefono": owner_data.telefono if owner_data else ""
            }
        }

    async def update_scan_data(self, scan_id: UUID, data: ScanUpdate):
        """
        Actualiza los datos del escaneo (ubicación, mensaje).
        Fijamos el ID como UUID para que Neon no lance DatatypeMismatchError.
        """
        # 1. Asegurar que buscamos por el tipo correcto (UUID)
        result = await self.db.execute(select(Scan).where(Scan.id == scan_id))
        db_scan = result.scalar_one_or_none()
        
        if not db_scan:
            return None

        # 2. Actualizar solo los campos enviados (lat, long, mensaje, etc.)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_scan, key, value)

        await self.db.commit()
        await self.db.refresh(db_scan)
        
        return db_scan

    async def get_pet_scans(self, pet_id: UUID, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Obtiene el historial de escaneos de una mascota específica"""
        offset = (page - 1) * limit
        scans = await self.scan_repo.get_by_mascota(pet_id, limit, offset)
        
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
        """Listado administrativo global"""
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