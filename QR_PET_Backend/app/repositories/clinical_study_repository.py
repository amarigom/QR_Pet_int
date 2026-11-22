from typing import Optional, Sequence
from uuid import UUID
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.clinical_study import ClinicalStudy


class ClinicalStudyRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, study: ClinicalStudy) -> ClinicalStudy:
        self.db.add(study)
        await self.db.flush()
        await self.db.refresh(study)
        return study

    async def get_by_id(self, study_id: UUID) -> Optional[ClinicalStudy]:
        stmt = select(ClinicalStudy).where(ClinicalStudy.id == study_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_pet_id(
        self,
        pet_id: UUID,
        categoria: Optional[str] = None,
    ) -> Sequence[ClinicalStudy]:
        stmt = (
            select(ClinicalStudy)
            .where(ClinicalStudy.mascota_id == pet_id)
            .order_by(desc(ClinicalStudy.fecha_estudio), desc(ClinicalStudy.created_at))
        )
        if categoria:
            stmt = stmt.where(ClinicalStudy.categoria == categoria)

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete(self, study: ClinicalStudy) -> None:
        await self.db.delete(study)
        await self.db.flush()