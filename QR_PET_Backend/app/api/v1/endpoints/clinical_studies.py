from datetime import datetime
from functools import lru_cache
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_user
from app.config import settings
from app.core.constants import UserRole
from app.core.database import get_db
from app.infrastructure.storage.r2_storage import R2StorageAdapter
from app.models.user import User
from app.repositories.clinical_study_repository import ClinicalStudyRepository
from app.repositories.pet_repository import PetRepository
from app.schemas.clinical_study import (
    ClinicalStudyCreate,
    ClinicalStudyResponse,
    ClinicalStudyWithAccessUrl,
    TipoArchivoEstudio,
)
from app.services.clinical_study_service import ClinicalStudyService

router = APIRouter(prefix="/clinical-studies", tags=["Estudios Clínicos"])

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_EXTENSIONS: dict[str, TipoArchivoEstudio] = {
    "pdf": "PDF",
    "dcm": "DICOM",
    "dicom": "DICOM",
    "jpg": "IMAGE",
    "jpeg": "IMAGE",
    "png": "IMAGE",
    "webp": "IMAGE",
}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/dicom",
    "application/octet-stream",
    "image/jpeg",
    "image/png",
    "image/webp",
}


@lru_cache
def get_storage_adapter() -> R2StorageAdapter:
    return R2StorageAdapter(
        bucket_name=settings.R2_BUCKET_NAME,
        access_key_id=settings.R2_ACCESS_KEY_ID,
        secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        account_id=settings.R2_ACCOUNT_ID,
        endpoint_url=settings.R2_ENDPOINT_URL,
        region_name="auto" if not settings.R2_ENDPOINT_URL else "us-east-1",
    )


def get_clinical_study_service(
    db: AsyncSession = Depends(get_db),
    storage: R2StorageAdapter = Depends(get_storage_adapter),
) -> ClinicalStudyService:
    study_repo = ClinicalStudyRepository(db)
    pet_repo = PetRepository(db)
    return ClinicalStudyService(
        study_repo=study_repo,
        pet_repo=pet_repo,
        storage=storage,
    )


def _detect_and_validate_file(file: UploadFile) -> TipoArchivoEstudio:
    if not file.filename or "." not in file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe tener una extensión válida (.pdf, .dcm, .jpg, .png).",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Formato '.{ext}' no soportado. Permitidos: PDF, DICOM (.dcm) e imágenes (JPG, PNG, WEBP).",
        )

    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de contenido no permitido: {file.content_type}",
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío.",
        )

    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo supera el límite máximo permitido de 25 MB.",
        )

    return ALLOWED_EXTENSIONS[ext]


def _is_vet_user(user: User) -> bool:
    return user.rol == UserRole.VETERINARIO


def _is_admin_user(user: User) -> bool:
    return user.rol == UserRole.ADMIN


@router.post(
    "/",
    response_model=ClinicalStudyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subir un nuevo estudio clínico (veterinario o admin)",
)
async def upload_clinical_study(
    mascota_id: UUID = Form(...),
    titulo: str = Form(..., min_length=2, max_length=150),
    categoria: str = Form(..., min_length=2, max_length=50),
    notas_veterinario: Optional[str] = Form(None),
    fecha_estudio: Optional[datetime] = Form(None),
    solicitado_por: Optional[str] = Form(default=None, max_length=120),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: ClinicalStudyService = Depends(get_clinical_study_service),
) -> ClinicalStudyResponse:
    if not settings.is_r2_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El almacenamiento de estudios clínicos no está configurado en el servidor.",
        )

    tipo_archivo = _detect_and_validate_file(file)

    payload = ClinicalStudyCreate(
        mascota_id=mascota_id,
        titulo=titulo,
        categoria=categoria,
        tipo_archivo=tipo_archivo,
        solicitado_por=solicitado_por.strip() if solicitado_por else None,
        notas_veterinario=notas_veterinario,
        fecha_estudio=fecha_estudio,
    )

    return await service.upload_study(
        payload=payload,
        file_obj=file.file,
        filename=file.filename or f"estudio.{tipo_archivo.lower()}",
        content_type=file.content_type or "application/octet-stream",
        current_user_id=current_user.id,
        is_veterinarian=_is_vet_user(current_user),
        is_admin=_is_admin_user(current_user),
    )

@router.get(
    "/pet/{pet_id}",
    response_model=List[ClinicalStudyResponse],
    summary="Listar estudios clínicos de una mascota",
)
async def list_pet_clinical_studies(
    pet_id: UUID,
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    current_user: User = Depends(get_current_user),
    service: ClinicalStudyService = Depends(get_clinical_study_service),
) -> List[ClinicalStudyResponse]:
    studies = await service.list_pet_studies(
        pet_id=pet_id,
        current_user_id=current_user.id,
        is_veterinarian=_is_vet_user(current_user),
        is_admin=_is_admin_user(current_user),
        categoria=categoria,
    )
    return list(studies)


@router.get(
    "/{study_id}/access",
    response_model=ClinicalStudyWithAccessUrl,
    summary="Obtener estudio con enlace temporal seguro para visualización",
)
async def get_clinical_study_access(
    study_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ClinicalStudyService = Depends(get_clinical_study_service),
) -> ClinicalStudyWithAccessUrl:
    return await service.get_study_with_access_url(
        study_id=study_id,
        current_user_id=current_user.id,
        is_veterinarian=_is_vet_user(current_user),
        is_admin=_is_admin_user(current_user),
    )