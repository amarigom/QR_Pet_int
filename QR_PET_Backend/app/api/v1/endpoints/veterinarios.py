import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_veterinarian
from app.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.veterinario import PerfilVeterinario
from app.schemas.veterinario import (
    PerfilVeterinarioResponse,
    VeterinarianClientCreate,
    VeterinarianClientCreated,
)
from app.services.veterinarian_client_service import VeterinarianClientService

router = APIRouter(prefix="/veterinario", tags=["Veterinario"])
MAX_LOGO_BYTES = 2 * 1024 * 1024


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
    db: AsyncSession = Depends(get_db),
    veterinarian: User = Depends(require_veterinarian),
):
    result = await db.execute(
        select(PerfilVeterinario).where(
            PerfilVeterinario.user_id == veterinarian.id,
            PerfilVeterinario.activo.is_(True),
        )
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=404, detail="No se encontró un perfil veterinario activo.")

    contents = await file.read(MAX_LOGO_BYTES + 1)
    if len(contents) > MAX_LOGO_BYTES:
        raise HTTPException(status_code=413, detail="El logo no puede superar los 2 MB.")
    try:
        with Image.open(io.BytesIO(contents)) as image:
            if image.format not in {"PNG", "JPEG", "WEBP"}:
                raise HTTPException(
                    status_code=400,
                    detail="El logo debe ser una imagen PNG, JPG o WebP.",
                )
            image.verify()
        with Image.open(io.BytesIO(contents)) as image:
            image.thumbnail((512, 512), Image.Resampling.LANCZOS)
            normalized = image.convert("RGBA")
            settings.STATIC_BRAND_DIR.mkdir(parents=True, exist_ok=True)
            filename = f"{veterinarian.id}.webp"
            destination = settings.STATIC_BRAND_DIR / filename
            normalized.save(destination, format="WEBP", quality=88, method=6)
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as error:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida.") from error

    profile.logo_url = f"/static/brands/{filename}"
    await db.commit()
    await db.refresh(profile)
    return profile
