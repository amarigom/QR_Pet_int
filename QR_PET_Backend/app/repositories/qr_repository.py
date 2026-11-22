"""
Repository para operaciones de Códigos QR usando SQLAlchemy 2.0
"""
from typing import Any, List, Optional, Union
import uuid

from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.pet import Pet
from app.models.qr import QRCode, QRType
from app.models.user import User
from app.repositories.base import BaseRepository


class QRRepository(BaseRepository[QRCode]):
    """Repository para la tabla codigos_qr con lógica ORM"""

    def __init__(self, session: AsyncSession):
        super().__init__(model=QRCode, session=session)

    def _force_uuid(self, id_val: Any) -> Optional[uuid.UUID]:
        """Auxiliar para asegurar que el ID sea un objeto UUID"""
        if id_val is None:
            return None
        if isinstance(id_val, uuid.UUID):
            return id_val
        try:
            return uuid.UUID(str(id_val))
        except (ValueError, TypeError):
            return None

    async def create(
        self,
        codigo: str,
        lote: Optional[str] = None,
        mascota_id: Optional[Union[str, uuid.UUID]] = None,
        activo: bool = True,
        tipo: str = QRType.FISICO.value,
    ) -> QRCode:
        """Crea un nuevo QR (FISICO o CLINICO) asegurando el tipo de dato para mascota_id"""
        nuevo_qr = QRCode(
            codigo=codigo.upper(),
            lote=lote,
            mascota_id=self._force_uuid(mascota_id),
            activo=activo,
            tipo=tipo,
        )
        self.session.add(nuevo_qr)
        await self.session.flush()
        await self.session.refresh(nuevo_qr)
        return nuevo_qr

    async def get_by_code(self, codigo: str) -> Optional[QRCode]:
        """Obtiene un QR por su código alfanumérico"""
        query = select(QRCode).where(QRCode.codigo == codigo.upper())
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_code_for_update(self, codigo: str) -> Optional[QRCode]:
        query = (
            select(QRCode)
            .where(QRCode.codigo == codigo.upper())
            .with_for_update()
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_active_by_pet_for_update(
        self, mascota_id: uuid.UUID
    ) -> List[QRCode]:
        result = await self.session.execute(
            select(QRCode)
            .where(QRCode.mascota_id == mascota_id, QRCode.activo.is_(True))
            .with_for_update()
        )
        return list(result.scalars().all())

    async def get_by_mascota(
        self,
        mascota_id: Union[str, uuid.UUID],
        tipo: Optional[str] = None,
    ) -> Optional[QRCode]:
        """
        Obtiene el QR activo de una mascota.
        Si no se especifica `tipo` y conviven un FISICO y un CLINICO, prioriza el FISICO.
        """
        m_id = self._force_uuid(mascota_id)
        query = select(QRCode).where(
            QRCode.mascota_id == m_id,
            QRCode.activo.is_(True),
        )
        if tipo is not None:
            query = query.where(QRCode.tipo == tipo)
        else:
            query = query.order_by(
                (QRCode.tipo == QRType.FISICO.value).desc(),
                QRCode.created_at.desc(),
            )

        result = await self.session.execute(query.limit(1))
        return result.scalar_one_or_none()

    async def get_by_lote(self, lote: str) -> List[QRCode]:
        """Trae todos los registros pertenecientes a un lote específico"""
        result = await self.session.execute(
            select(QRCode).filter(QRCode.lote == lote).order_by(QRCode.codigo.asc())
        )
        return list(result.scalars().all())

    async def link_mascota(
        self,
        qr_id: Union[str, uuid.UUID],
        mascota_id: Union[str, uuid.UUID],
    ) -> Optional[QRCode]:
        """Vincula un QR a una mascota asegurando tipos UUID"""
        qr = await self.get_by_id(self._force_uuid(qr_id))
        if qr:
            qr.mascota_id = self._force_uuid(mascota_id)
            await self.session.flush()
            await self.session.refresh(qr)
        return qr

    async def get_available(self, limit: int = 100, offset: int = 0) -> List[QRCode]:
        """Obtiene QRs físicos que están activos pero no tienen mascota asignada"""
        query = (
            select(QRCode)
            .where(
                QRCode.mascota_id.is_(None),
                QRCode.activo.is_(True),
                QRCode.tipo == QRType.FISICO.value,
            )
            .order_by(QRCode.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    def _list_query(
        self,
        search: str | None = None,
        assignment: str = "all",
        tipo: str = "all",
    ):
        query = (
            select(QRCode)
            .outerjoin(Pet, QRCode.mascota_id == Pet.id)
            .outerjoin(User, Pet.usuario_id == User.id)
        )
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    QRCode.codigo.ilike(term),
                    QRCode.lote.ilike(term),
                    Pet.nombre.ilike(term),
                    User.nombre.ilike(term),
                    User.email.ilike(term),
                )
            )
        if assignment == "assigned":
            query = query.where(QRCode.mascota_id.is_not(None))
        elif assignment == "available":
            query = query.where(QRCode.mascota_id.is_(None))

        if tipo in (QRType.FISICO.value, QRType.CLINICO.value):
            query = query.where(QRCode.tipo == tipo)

        return query

    async def get_all_with_details(
        self,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
        assignment: str = "all",
        tipo: str = "all",
    ) -> List[QRCode]:
        """
        Obtiene todos los QRs cargando la mascota, su dueño y la relación inversa del QR
        en una sola consulta para evitar la carga perezosa en Pydantic.
        """
        query = (
            self._list_query(search=search, assignment=assignment, tipo=tipo)
            .options(
                joinedload(QRCode.mascota).joinedload(Pet.owner),
                joinedload(QRCode.mascota).joinedload(Pet.qr_code),
            )
            .order_by(QRCode.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = await self.session.execute(query)
        return list(result.scalars().unique().all())

    async def count_filtered(
        self,
        search: str | None = None,
        assignment: str = "all",
        tipo: str = "all",
    ) -> int:
        query = self._list_query(
            search=search,
            assignment=assignment,
            tipo=tipo,
        ).with_only_columns(func.count(func.distinct(QRCode.id)))
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def code_exists(self, codigo: str) -> bool:
        """Verifica existencia de código de forma rápida"""
        query = select(exists().where(QRCode.codigo == codigo.upper()))
        result = await self.session.execute(query)
        return result.scalar() or False

    async def update_status(self, db_qr: QRCode, activo: bool) -> QRCode:
        """Modifica físicamente la columna 'activo' de la placa y persiste en BD"""
        db_qr.activo = activo

        await self.session.commit()
        await self.session.refresh(db_qr)

        return db_qr