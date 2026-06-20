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


    

# ... dentro de tu clase ScanRepository ...

    async def update_location_with_relations(
        self, 
        scan_id: uuid.UUID, 
        latitud: Optional[float] = None, 
        longitud: Optional[float] = None,
        mensaje_encontrador: Optional[str] = None,
        telefono_encontrador: Optional[str] = None
    ):
        # 1. Buscamos el registro actual con la carga profunda de relaciones
        query = (
            select(self.model)
            .options(
                joinedload(self.model.qr)
                .joinedload(QRCode.mascota)
                .joinedload(Pet.owner)
            )
            .where(self.model.id == scan_id)
        )
        result = await self.session.execute(query)
        scan_record = result.scalar_one_or_none()
        
        if not scan_record:
            return None

        # 2. Actualización selectiva: Solo pisamos si el valor no es None
        if latitud is not None:
            scan_record.latitud = latitud
        if longitud is not None:
            scan_record.longitud = longitud
            
        if mensaje_encontrador is not None:
            scan_record.mensaje_encontrador = mensaje_encontrador
        if telefono_encontrador is not None:
            scan_record.telefono_encontrador = telefono_encontrador

        # 3. Guardamos los cambios de forma asíncrona
        await self.session.flush()
        
        # 4. Refresh completo para asegurar relaciones vivas
        query_final = (
            select(self.model)
            .options(
                joinedload(self.model.qr)
                .joinedload(QRCode.mascota)
                .joinedload(Pet.owner)
            )
            .where(self.model.id == scan_id)
        )
        result_final = await self.session.execute(query_final)
        return result_final.scalar_one_or_none()