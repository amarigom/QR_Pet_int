"""
Repository para operaciones de Códigos QR usando SQLAlchemy 2.0
"""
from typing import Optional, List, Any, Union
import uuid
from sqlalchemy import select, exists
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import BaseRepository
from app.models.qr import QRCode
from app.models.pet import Pet

class QRRepository(BaseRepository[QRCode]):
    """Repository para la tabla codigos_qr con lógica ORM"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(model=QRCode,session= session)

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
        lote: Optional[str] = None,  # 🚀 Agregamos el parámetro lote opcional
        mascota_id: Optional[Union[str, uuid.UUID]] = None,
        activo: bool = True
    ) -> QRCode:
        """Crea un nuevo QR asegurando el tipo de dato para mascota_id y asignando lote si corresponde"""
        nuevo_qr = QRCode(
            codigo=codigo.upper(),
            lote=lote,  
            mascota_id=self._force_uuid(mascota_id),
            activo=activo
        )
        self.session.add(nuevo_qr)
        # El flush envía los cambios a Neon sin cerrar la transacción todavía
        await self.session.flush()
        await self.session.refresh(nuevo_qr)
        return nuevo_qr

    async def get_by_code(self, codigo: str) -> Optional[QRCode]:
        """Obtiene un QR por su código alfanumérico"""
        query = select(QRCode).where(QRCode.codigo == codigo.upper())
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_mascota(self, mascota_id: Union[str, uuid.UUID]) -> Optional[QRCode]:
        """
        Obtiene el QR vinculado a una mascota específica.
        Corregido para evitar error de tipos uuid = character varying
        """
        m_id = self._force_uuid(mascota_id)
        query = select(QRCode).where(QRCode.mascota_id == m_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_lote(self, lote: str) -> List[QRCode]:
        """Únicamente va a la base de datos y trae los registros puros"""
        result = await self.session.execute(
        select(QRCode).filter(QRCode.lote == lote).order_by(QRCode.codigo.asc())
    )
        return result.scalars().all()

    async def link_mascota(self, qr_id: Union[str, uuid.UUID], mascota_id: Union[str, uuid.UUID]) -> Optional[QRCode]:
        """Vincula un QR a una mascota asegurando tipos UUID"""
        qr = await self.get_by_id(self._force_uuid(qr_id))
        if qr:
            qr.mascota_id = self._force_uuid(mascota_id)
            await self.session.flush()
            await self.session.refresh(qr)
        return qr

    async def get_available(self, limit: int = 100, offset: int = 0) -> List[QRCode]:
        """Obtiene QRs que están activos pero no tienen mascota asignada"""
        query = (
            select(QRCode)
            .where(QRCode.mascota_id == None, QRCode.activo == True)
            .order_by(QRCode.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    # 🎯 Asegurate de que empiece con "async def"
    async def get_all_with_details(self, limit: int = 100, offset: int = 0) -> List[QRCode]:
        """
        Obtiene todos los QRs cargando la mascota, su dueño y la relación inversa del QR 
        en una sola consulta para evitar la carga perezosa en Pydantic.
        """
        query = (
            select(QRCode)
            .options(
                joinedload(QRCode.mascota).joinedload(Pet.owner),
                joinedload(QRCode.mascota).joinedload(Pet.qr_code)
            )
            .order_by(QRCode.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        
        # El await acá adentro ahora va a funcionar perfectamente
        result = await self.session.execute(query)
        return list(result.scalars().unique().all())

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