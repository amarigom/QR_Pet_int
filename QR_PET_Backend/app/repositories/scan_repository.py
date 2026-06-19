import uuid
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.scan import Scan
from app.models.qr import QRCode
from app.models.pet import Pet

class ScanRepository(BaseRepository[Scan]):
    
    
    """Repository para la tabla escaneos con Sesión Inyectada"""
    
    def __init__(self, session: AsyncSession):
        # Inyectamos la sesión y el modelo al BaseRepository
        super().__init__(model=Scan, session=session)
    
    # Eliminamos el método create personalizado. 
    # El BaseRepository ya tiene uno genérico que hace add() y flush().

    async def get_by_qr(self, qr_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[Scan]:
        """Obtiene los escaneos vinculados a un QR específico"""
        query = (
            select(Scan)
            .where(Scan.qr_id == qr_id)
            .order_by(Scan.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def count_by_qr(self, qr_id: uuid.UUID) -> int:
        """Cuenta cuántos escaneos tiene un QR"""
        query = select(func.count()).select_from(Scan).where(Scan.qr_id == qr_id)
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    async def get_all_with_details(self, limit: int = 100, offset: int = 0) -> List[Scan]:
        """Obtiene escaneos con carga profunda (QR -> Mascota -> Dueño)"""
        query = (
            select(Scan)
            .options(
                joinedload(Scan.qr)
                .joinedload(QRCode.mascota)
                .joinedload(Pet.owner)
            )
            .order_by(Scan.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().unique().all())
    
    async def get_by_mascota(self, mascota_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[Scan]:
        """Obtiene escaneos filtrando por el ID de la mascota mediante JOIN"""
        query = (
            select(Scan)
            .join(QRCode)
            .where(QRCode.mascota_id == mascota_id)
            .order_by(Scan.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def count_recent_scans(self, days: int = 30) -> int:
        """Cuenta escaneos globales de los últimos N días"""
        since_date = datetime.now() - timedelta(days=days)
        query = (
            select(func.count())
            .select_from(Scan)
            .where(Scan.created_at >= since_date)
        )
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    
    async def get_all_scans_with_coords(self) -> List[Scan]:
        """Consulta bruta para el mapa de calor (Admin)"""
        query = (
            select(Scan)
            .options(joinedload(Scan.qr).joinedload(QRCode.mascota)) # Carga relaciones para evitar lazy loading
            .filter(Scan.latitud.isnot(None))
            .filter(Scan.longitud.isnot(None))
            .order_by(Scan.created_at.desc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_by_mascota_with_details(self, mascota_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[Scan]:
        """Obtiene escaneos de una mascota con carga profunda del QR para evitar Lazy Loading"""
        query = (
            select(Scan)
            .join(QRCode)
            .options(joinedload(Scan.qr)) # 🎯 Trae el QR cargado de un tiro si lo vas a renderizar en el frontend
            .where(QRCode.mascota_id == mascota_id)
            .order_by(Scan.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().unique().all())
# 🎯 AGREGÁ ESTE MÉTODO AL FINAL DE TU CLASE EN app/repositories/scan_repository.py
    async def update_location_with_relations(self, scan_id: uuid.UUID, latitud: float, longitud: float) -> Optional[Scan]:
        """
        Busca un escaneo específico por su ID cargando recursivamente todo el 
        árbol relacional (QR -> Mascota -> Dueño), actualiza sus coordenadas y guarda.
        """
        query = (
            select(Scan)
            .options(
                joinedload(Scan.qr)
                .joinedload(QRCode.mascota)
                .joinedload(Pet.owner)
            )
            .where(Scan.id == scan_id)
        )
        result = await self.session.execute(query)
        scan_record = result.scalars().unique().one_or_none()

        if not scan_record:
            return None

        # Actualizamos los campos con la ubicación precisa GPS
        scan_record.latitud = latitud
        scan_record.longitud = longitud

        # Impactamos los cambios en la base de datos
        await self.session.commit()
        await self.session.refresh(scan_record)
        
        return scan_record