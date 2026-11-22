from typing import List
import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import (
    get_veterinarian_profile_service,
    require_veterinarian,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.veterinario import (
    DiagnosticAltaExpressCreate,
    DiagnosticAltaExpressResponse,
    DiagnosticPetLookupItem,
    PerfilVeterinarioResponse,
    VeterinarianClientCreate,
    VeterinarianClientCreated,
)
from app.services.veterinarian_client_service import VeterinarianClientService
from app.services.veterinarian_diagnostic_service import VeterinarianDiagnosticService
from app.services.veterinarian_profile_service import (
    MAX_LOGO_BYTES,
    VeterinarianProfileService,
)

router = APIRouter(prefix="/veterinario", tags=["Veterinario"])


@router.post(
    "/clientes",
    response_model=VeterinarianClientCreated,
    status_code=status.HTTP_201_CREATED,
)
async def crear_cliente(
    data: VeterinarianClientCreate,
    db: AsyncSession = Depends(get_db),
    veterinarian: User = Depends(require_veterinarian),
):
    return await VeterinarianClientService(db).create_client(data, veterinarian)


@router.post(
    "/clientes/{client_id}/reenviar-activacion",
    response_model=VeterinarianClientCreated,
)
async def reenviar_activacion_cliente(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    veterinarian: User = Depends(require_veterinarian),
):
    return await VeterinarianClientService(db).resend_activation(client_id, veterinarian)


@router.put("/perfil/logo", response_model=PerfilVeterinarioResponse)
async def actualizar_logo(
    file: UploadFile = File(...),
    veterinarian: User = Depends(require_veterinarian),
    service: VeterinarianProfileService = Depends(get_veterinarian_profile_service),
):
    contents = await file.read(MAX_LOGO_BYTES + 1)
    return await service.update_logo(veterinarian.id, contents)


@router.get(
    "/estudios/buscar-mascota",
    response_model=List[DiagnosticPetLookupItem],
)
async def buscar_mascota_para_estudio(
    q: str = Query(..., min_length=2, max_length=100),
    db: AsyncSession = Depends(get_db),
    veterinarian: User = Depends(require_veterinarian),
):
    """Busca mascotas (vinculadas o externas) por código QR, email, teléfono o nombre."""
    return await VeterinarianDiagnosticService(db).lookup_pets_for_study(q)


@router.post(
    "/estudios/alta-express",
    response_model=DiagnosticAltaExpressResponse,
    status_code=status.HTTP_201_CREATED,
)
async def alta_express_estudio(
    data: DiagnosticAltaExpressCreate,
    db: AsyncSession = Depends(get_db),
    veterinarian: User = Depends(require_veterinarian),
):
    """Registra dueño + mascota nueva + QR Clínico (CLN-XXXXXX) para subir estudios externos."""
    return await VeterinarianDiagnosticService(db).register_alta_express(
        data=data,
        veterinarian=veterinarian,
    )