# app/api/v1/endpoints/historias_clinicas.py
import uuid
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.dependencies import get_vector_store_service, require_veterinarian
from app.models.user import User
from app.schemas.historia_clinica import HistoriaClinicaCreate, HistoriaClinicaResponse
from app.services.historia_clinica_service import HistoriaClinicaService
from app.factories.historia_clinica_factory import ExportFormat
from app.services.pgvector_service import VectorStoreService

router = APIRouter(prefix="/historias-clinicas", tags=["Historias Clínicas"])

@router.post("/", response_model=HistoriaClinicaResponse, status_code=status.HTTP_201_CREATED)
async def crear_historia_clinica(
    data: HistoriaClinicaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinarian),
    vector_service: VectorStoreService = Depends(get_vector_store_service),
):
    service = HistoriaClinicaService(db, vector_service)
    return await service.registrar_consulta(data, current_user)


@router.post("/vectorizar")
async def vectorizar_historias_pendientes(
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinarian),
    vector_service: VectorStoreService = Depends(get_vector_store_service),
):
    service = HistoriaClinicaService(db, vector_service)
    return await service.vectorizar_historias_pendientes(current_user, limit)

@router.get("/mascota/{mascota_id}", response_model=List[HistoriaClinicaResponse])
async def obtener_historias_por_mascota(
    mascota_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinarian),
):
    service = HistoriaClinicaService(db)
    return await service.obtener_por_mascota(mascota_id, current_user)

@router.get("/{historia_id}/exportar")
async def exportar_historia_clinica(
    historia_id: uuid.UUID,
    formato: ExportFormat = ExportFormat.PDF,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinarian),
):
    service = HistoriaClinicaService(db)
    return await service.exportar_historia_clinica(historia_id, formato, current_user)