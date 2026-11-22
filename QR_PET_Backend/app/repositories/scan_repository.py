from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.pet import Pet
from app.models.qr import QRCode, QRType
from app.models.scan import Scan
from app.repositories.base import BaseRepository


class ScanRepository(BaseRepository[Scan]):
    """Repository para la tabla escaneos con Sesión Inyectada"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=Scan, session=session)

    async def get_by_qr(
        self, qr_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> List[Scan]:
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

    async def get_scans_since(self, since_date: datetime):
        query = (
            select(Scan)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .where(
                Scan.created_at >= since_date,
                QRCode.tipo == QRType.FISICO.value,
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_by_qr(self, qr_id: uuid.UUID) -> int:
        """Cuenta cuántos escaneos tiene un QR"""
        query = select(func.count()).select_from(Scan).where(Scan.qr_id == qr_id)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def count_by_mascota(self, mascota_id: uuid.UUID) -> int:
        query = (
            select(func.count())
            .select_from(Scan)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .where(
                QRCode.mascota_id == mascota_id,
                QRCode.tipo == QRType.FISICO.value,
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_by_mascota(
        self, mascota_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> List[Scan]:
        """Obtiene escaneos físicos filtrando por el ID de la mascota mediante JOIN"""
        query = (
            select(Scan)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .where(
                QRCode.mascota_id == mascota_id,
                QRCode.tipo == QRType.FISICO.value,
            )
            .order_by(Scan.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_recent_scans(self, days: int = 30) -> int:
        """Cuenta escaneos físicos globales de los últimos N días"""
        since_date = datetime.now() - timedelta(days=days)
        query = (
            select(func.count())
            .select_from(Scan)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .where(
                Scan.created_at >= since_date,
                QRCode.tipo == QRType.FISICO.value,
            )
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_all_scans_with_coords(self) -> List[Scan]:
        """Consulta para el mapa de calor (Admin) — excluye QRs clínicos"""
        query = (
            select(Scan)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .options(joinedload(Scan.qr).joinedload(QRCode.mascota))
            .where(
                Scan.latitud.is_not(None),
                Scan.longitud.is_not(None),
                QRCode.tipo == QRType.FISICO.value,
            )
            .order_by(Scan.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_all_with_details(
        self, limit: int = 100, offset: int = 0
    ) -> List[Scan]:
        """Obtiene únicamente el ÚLTIMO escaneo físico de cada mascota usando DISTINCT ON"""
        query = (
            select(Scan)
            .distinct(Scan.qr_id)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .where(QRCode.tipo == QRType.FISICO.value)
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
        scans.sort(key=lambda x: x.created_at, reverse=True)
        return scans

    async def update_location_with_relations(
        self,
        scan_id: uuid.UUID,
        latitud: Optional[float] = None,
        longitud: Optional[float] = None,
        mensaje_encontrador: Optional[str] = None,
        telefono_encontrador: Optional[str] = None,
    ) -> Optional[Scan]:
        """Procesa las actualizaciones selectivas de ubicación y datos del formulario."""
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

        if latitud is not None:
            scan_record.latitud = latitud
        if longitud is not None:
            scan_record.longitud = longitud
        if mensaje_encontrador is not None:
            scan_record.mensaje_encontrador = mensaje_encontrador
        if telefono_encontrador is not None:
            scan_record.telefono_encontrador = telefono_encontrador

        await self.session.flush()

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

    async def get_latest_scans_by_user(
        self, user_id: uuid.UUID, limit: int = 100, offset: int = 0
    ) -> List[Scan]:
        """
        Obtiene únicamente el ÚLTIMO escaneo físico de cada mascota del usuario común.
        """
        query = (
            select(Scan)
            .distinct(Scan.qr_id)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .join(Pet, QRCode.mascota_id == Pet.id)
            .where(
                Pet.usuario_id == user_id,
                QRCode.tipo == QRType.FISICO.value,
            )
            .options(
                joinedload(Scan.qr),
                joinedload(Scan.qr).joinedload(QRCode.mascota),
            )
            .order_by(Scan.qr_id, desc(Scan.created_at))
            .limit(limit)
            .offset(offset)
        )

        result = await self.session.execute(query)
        scans = list(result.scalars().unique().all())
        scans.sort(key=lambda x: x.created_at, reverse=True)
        return scans