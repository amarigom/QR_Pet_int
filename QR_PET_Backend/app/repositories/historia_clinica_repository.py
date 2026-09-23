import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.historia_clinica import HistoriaClinica

class HistoriaClinicaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, historia: HistoriaClinica) -> HistoriaClinica:
        self.db.add(historia)
        await self.db.commit()
        await self.db.refresh(historia)
        return historia

    async def get_by_id(self, historia_id: uuid.UUID) -> Optional[HistoriaClinica]:
        query = select(HistoriaClinica).where(HistoriaClinica.id == historia_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_mascota(self, mascota_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[HistoriaClinica]:
        query = (
            select(HistoriaClinica)
            .where(HistoriaClinica.mascota_id == mascota_id)
            .order_by(HistoriaClinica.fecha_consulta.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_veterinario(self, veterinario_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[HistoriaClinica]:
        query = (
            select(HistoriaClinica)
            .where(HistoriaClinica.veterinario_id == veterinario_id)
            .order_by(HistoriaClinica.fecha_consulta.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())