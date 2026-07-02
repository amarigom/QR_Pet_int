import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, func,desc
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.scan import Scan
from app.models.qr import QRCode
from app.models.pet import Pet
import logging

class ScanRepository(BaseRepository[Scan]):
    """Repository para la tabla escaneos con Sesión Inyectada"""
    
    def __init__(self, session: AsyncSession):
        # Inyectamos la sesión y el modelo al BaseRepository
        super().__init__(model=Scan, session=session)
    
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
        """Obtiene únicamente el ÚLTIMO escaneo de cada mascota con carga profunda (QR -> Mascota -> Dueño)"""
        from sqlalchemy import row_number

        # 1. Creamos una subconsulta que numera los escaneos de cada QR por fecha (el más nuevo recibe el número 1)
        subquery = (
            select(
                Scan.id,
                row_number()
                .over(partition_by=Scan.qr_id, order_by=Scan.created_at.desc())
                .label("rn"),
            )
            .subquery()
        )

        # 2. Obtenemos de forma asíncrona solo los IDs que tienen el número 1 (el último impacto de cada chapita)
        ids_query = (
            select(subquery.c.id)
            .where(subquery.c.rn == 1)
            .limit(limit)
            .offset(offset)
        )
        
        result_ids = await self.session.execute(ids_query)
        scan_ids = result_ids.scalars().all()

        if not scan_ids:
            return []

        # 3. Traemos los objetos completos con todas sus relaciones cargadas en un solo tiro (Eager Loading)
        final_query = (
            select(Scan)
            .options(
                joinedload(Scan.qr)
                .joinedload(QRCode.mascota)
                .joinedload(Pet.owner)
            )
            .where(Scan.id.in_(scan_ids))
            .order_by(Scan.created_at.desc())
        )

        result = await self.session.execute(final_query)
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
    
    async def get_all_with_details(self, limit: int = 100, offset: int = 0) -> List[Scan]:
        """Obtiene únicamente el ÚLTIMO escaneo de cada mascota usando DISTINCT ON de PostgreSQL"""
        # DISTINCT ON asegura una única fila por qr_id. 
        # Al ordenar por qr_id y luego por created_at.desc(), Postgres se queda con el más nuevo.
        query = (
            select(Scan)
            .distinct(Scan.qr_id)
            .options(
                joinedload(Scan.qr)
                .joinedload(QRCode.mascota)
                .joinedload(Pet.owner)
            )
            .order_by(Scan.qr_id, Scan.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.session.execute(query)
        scans = list(result.scalars().unique().all())
        
        # Volvemos a ordenar la lista final por fecha descendente para que en el Dashboard
        # veas arriba de todo las mascotas que se escanearon más recientemente.
        scans.sort(key=lambda x: x.created_at, reverse=True)
        return scans

    async def update_location_with_relations(
        self, 
        scan_id: uuid.UUID, 
        latitud: Optional[float] = None, 
        longitud: Optional[float] = None,
        mensaje_encontrador: Optional[str] = None,
        telefono_encontrador: Optional[str] = None
    ) -> Optional[Scan]:
        """Procesa las actualizaciones selectivas de ubicación y datos del formulario."""
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

        # 3. Guardamos los cambios de forma asíncrona en memoria (Flush)
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
    
    

    async def get_latest_scans_by_user(self, user_id: uuid.UUID, limit: int = 100, offset: int = 0) -> List[Scan]:
        """
        Obtiene únicamente el ÚLTIMO escaneo de cada mascota del usuario común
        forzando las condiciones de JOIN explícitas.
        """
        # 🚨 LOG DE CONTROL: Para ver qué ID está llegando realmente al repositorio
        print(f"🔍 REPOSITORIO: Buscando últimos escaneos para el usuario_id: {user_id} (Tipo: {type(user_id)})")

        query = (
            select(Scan)
            .distinct(Scan.qr_id)
            # 1. Joins explícitos asegurando las Claves Foráneas reales
            .join(QRCode, Scan.qr_id == QRCode.id)
            .join(Pet, QRCode.mascota_id == Pet.id)
            # 2. Filtro estricto por el usuario_id de la mascota
            .where(Pet.usuario_id == user_id)
            # 3. Eager loading para evitar consultas N+1
            .options(
                joinedload(Scan.qr),
                joinedload(Scan.qr).joinedload(QRCode.mascota)
            )
            # 4. Orden requerido por DISTINCT ON (Primero la columna del distinct, luego el orden de negocio)
            .order_by(Scan.qr_id, desc(Scan.created_at))
            .limit(limit)
            .offset(offset)
        )
        
        result = await self.session.execute(query)
        scans = list(result.scalars().unique().all())
        
        # Ordenamos globalmente por lo más nuevo para el mapa
        scans.sort(key=lambda x: x.created_at, reverse=True)
        
        print(f" REPOSITORIO: Se encontraron {len(scans)} escaneos para el usuario {user_id}")
        return scans