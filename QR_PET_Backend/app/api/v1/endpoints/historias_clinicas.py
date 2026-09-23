# app/api/v1/endpoints/historias_clinicas.py
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.schemas.historia_clinica import HistoriaClinicaCreate, HistoriaClinicaResponse
from app.services.historia_clinica_service import HistoriaClinicaService
from app.factories.historia_clinica_factory import ExportFormat

router = APIRouter(prefix="/historias-clinicas", tags=["Historias Clínicas"])

@router.post("/", response_model=HistoriaClinicaResponse, status_code=status.HTTP_201_CREATED)
async def crear_historia_clinica(
    data: HistoriaClinicaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = HistoriaClinicaService(db)
    return await service.registrar_consulta(data, current_user)

@router.get("/mascota/{mascota_id}", response_model=List[HistoriaClinicaResponse])
async def obtener_historias_por_mascota(
    mascota_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = HistoriaClinicaService(db)
    return await service.obtener_por_mascota(mascota_id)

@router.get("/{historia_id}/exportar")
async def exportar_historia_clinica(
    historia_id: uuid.UUID,
    formato: ExportFormat = ExportFormat.PDF,
    db: AsyncSession = Depends(get_db)
):
    service = HistoriaClinicaService(db)
    return await service.exportar_historia_clinica(historia_id, formato)