from datetime import datetime, timezone
from typing import BinaryIO, Optional, Protocol, Sequence
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select

from app.models.clinical_study import ClinicalStudy
from app.models.veterinario_mascota import veterinario_mascotas
from app.repositories.clinical_study_repository import ClinicalStudyRepository
from app.schemas.clinical_study import (
    ClinicalStudyCreate,
    ClinicalStudyResponse,
    ClinicalStudyWithAccessUrl,
)


class StorageProvider(Protocol):
    """Contrato desacoplado para almacenamiento de objetos (R2 / S3 / Local)."""
    async def upload_file(self, file_obj: BinaryIO, key: str, content_type: str) -> int: ...
    def generate_presigned_url(self, key: str, expires_in: int = 900) -> str: ...
    async def delete_file(self, key: str) -> None: ...


class PetLookupRepository(Protocol):
    """Contrato mínimo esperado de tu repositorio de mascotas."""
    async def get_by_id(self, pet_id: UUID): ...


class ClinicalStudyService:
    PRESIGNED_TTL_SECONDS = 900  # 15 minutos

    def __init__(
        self,
        study_repo: ClinicalStudyRepository,
        pet_repo: PetLookupRepository,
        storage: StorageProvider,
    ) -> None:
        self.study_repo = study_repo
        self.pet_repo = pet_repo
        self.storage = storage

    async def _is_linked_veterinarian(
        self, mascota_id: UUID, user_id: UUID
    ) -> bool:
        """Verifica si el usuario veterinario está vinculado como cabecera en veterinario_mascotas."""
        stmt = (
            select(veterinario_mascotas.c.mascota_id)
            .where(
                veterinario_mascotas.c.mascota_id == mascota_id,
                veterinario_mascotas.c.veterinario_id == user_id,
            )
            .limit(1)
        )
        result = await self.study_repo.db.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def _can_read_all_pet_studies(
        self,
        pet_usuario_id: UUID,
        mascota_id: UUID,
        current_user_id: UUID,
        is_veterinarian: bool,
        is_admin: bool = False,
    ) -> bool:
        """Determina si el usuario puede ver el historial completo de estudios de la mascota."""
        if is_admin:
            return True
        if pet_usuario_id == current_user_id:
            return True
        if is_veterinarian:
            return await self._is_linked_veterinarian(mascota_id, current_user_id)
        return False

    async def upload_study(
        self,
        payload: ClinicalStudyCreate,
        file_obj: BinaryIO,
        filename: str,
        content_type: str,
        current_user_id: UUID,
        is_veterinarian: bool = False,
        is_admin: bool = False,
    ) -> ClinicalStudyResponse:
        pet = await self.pet_repo.get_by_id(payload.mascota_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mascota no encontrada.",
            )

        # Cualquier veterinario habilitado (de cabecera o centro diagnóstico externo) o admin puede subir estudios.
        # El tutor dueño sigue bloqueado en modo solo lectura.
        if not is_admin and not is_veterinarian:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo un veterinario o centro diagnóstico autorizado puede subir estudios clínicos.",
            )

        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
        file_key = f"estudios/{payload.mascota_id}/{uuid4()}.{extension}"

        size_bytes = await self.storage.upload_file(
            file_obj=file_obj,
            key=file_key,
            content_type=content_type,
        )

        study = ClinicalStudy(
            mascota_id=payload.mascota_id,
            veterinario_id=current_user_id if is_veterinarian else None,
            solicitado_por=getattr(payload, "solicitado_por", None),
            titulo=payload.titulo,
            categoria=payload.categoria,
            tipo_archivo=payload.tipo_archivo,
            file_key=file_key,
            tamano_bytes=size_bytes,
            notas_veterinario=payload.notas_veterinario,
            fecha_estudio=payload.fecha_estudio
            or datetime.now(timezone.utc).replace(tzinfo=None),
        )

        try:
            saved = await self.study_repo.create(study)
            await self.study_repo.db.commit()
            return ClinicalStudyResponse.model_validate(saved)
        except Exception:
            await self.study_repo.db.rollback()
            await self.storage.delete_file(file_key)
            raise

    async def list_pet_studies(
        self,
        pet_id: UUID,
        current_user_id: UUID,
        is_veterinarian: bool = False,
        is_admin: bool = False,
        categoria: Optional[str] = None,
    ) -> Sequence[ClinicalStudyResponse]:
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mascota no encontrada.",
            )

        can_read_all = await self._can_read_all_pet_studies(
            pet_usuario_id=pet.usuario_id,
            mascota_id=pet_id,
            current_user_id=current_user_id,
            is_veterinarian=is_veterinarian,
            is_admin=is_admin,
        )

        # Si no es dueño, admin ni veterinario de cabecera, solo puede ver estudios cargados por él mismo
        if not can_read_all and not is_veterinarian:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para ver los estudios de esta mascota.",
            )

        studies = await self.study_repo.list_by_pet_id(
            pet_id=pet_id,
            categoria=categoria,
        )

        if not can_read_all and is_veterinarian:
            studies = [s for s in studies if s.veterinario_id == current_user_id]

        return [ClinicalStudyResponse.model_validate(s) for s in studies]

    async def get_study_with_access_url(
        self,
        study_id: UUID,
        current_user_id: UUID,
        is_veterinarian: bool = False,
        is_admin: bool = False,
    ) -> ClinicalStudyWithAccessUrl:
        study = await self.study_repo.get_by_id(study_id)
        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estudio clínico no encontrado.",
            )

        pet = await self.pet_repo.get_by_id(study.mascota_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mascota asociada no encontrada.",
            )

        can_read_all = await self._can_read_all_pet_studies(
            pet_usuario_id=pet.usuario_id,
            mascota_id=study.mascota_id,
            current_user_id=current_user_id,
            is_veterinarian=is_veterinarian,
            is_admin=is_admin,
        )

        is_study_author = is_veterinarian and study.veterinario_id == current_user_id

        if not can_read_all and not is_study_author:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés acceso a este estudio clínico.",
            )

        signed_url = self.storage.generate_presigned_url(
            key=study.file_key,
            expires_in=self.PRESIGNED_TTL_SECONDS,
        )

        base_data = ClinicalStudyResponse.model_validate(study).model_dump()
        return ClinicalStudyWithAccessUrl(
            **base_data,
            access_url=signed_url,
            expires_in_seconds=self.PRESIGNED_TTL_SECONDS,
        )