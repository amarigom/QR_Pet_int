import uuid

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import (
    get_veterinarian_profile_service,
    require_veterinarian,
)
from app.core.database import get_db
from app.models.user import User
from app.schemas.veterinario import (
    PerfilVeterinarioResponse,
    VeterinarianClientCreate,
    VeterinarianClientCreated,
)
from app.services.veterinarian_client_service import VeterinarianClientService
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
