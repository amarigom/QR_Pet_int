import uuid
import logging
from typing import Optional, Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# Repositorios y Excepciones
from app.repositories.pet_repository import PetRepository
from app.repositories.qr_repository import QRRepository
from app.repositories.pet_vector_repository import PetVectorRepository
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.schemas.composite import PetDetailResponse
from app.models.user import User
from app.core.exceptions import ResourceNotFoundException, ForbiddenException
from app.core.constants import UserRole
from app.services.pgvector_service import VectorStoreService

logger = logging.getLogger(__name__)


class PetService:
    def __init__(self, pet_repo: PetRepository, vector_service: VectorStoreService,):
        self.pet_repo = pet_repo
        self.vector_service = vector_service

    def _build_semantic_text(self, pet: Any) -> str:
        """Construye el texto enriquecido para generar el embedding (SÍNCRONO)."""
        nombre = getattr(pet, "nombre", "") or ""
        especie = getattr(pet, "especie", "") or ""
        raza = getattr(pet, "raza", "") or ""
        nota = (
            getattr(
                pet,
                "notas",
                getattr(pet, "notes", getattr(pet, "descripcion", "")),
            )
            or ""
        )

        return f"Nombre: {nombre}. Especie: {especie}. Raza: {raza}. Detalles: {nota}".strip()

    def _build_metadata(self, pet: Any) -> Dict[str, Any]:
        """Extrae la metadata estructurada (SÍNCRONO)."""
        return {
            "especie": str(getattr(pet, "especie", "") or "").lower(),
            "raza": str(getattr(pet, "raza", "") or "").lower(),
            "color": str(getattr(pet, "color", "") or "").lower(),
            "estado": str(getattr(pet, "estado", "") or "").lower(),
        }

    async def reindex_pet(self, pet: Any) -> bool:
        """Indexa una sola mascota en pgvector."""
        texto_completo = self._build_semantic_text(pet)
        metadata = self._build_metadata(pet)

        return await self.vector_service.ingestar_archivo(
            doc_id=str(pet.id),
            titulo=getattr(pet, "nombre", "Mascota"),
            contenido=texto_completo,
            categoria=metadata.get("especie", "general"),
            metadata=metadata,
        )

    async def sincronizar_vectores(
        self, db: AsyncSession, batch_size: int = 50
    ) -> Dict[str, Any]:
        """Sincroniza masivamente la tabla de vectores."""
        try:
            await db.execute(text("TRUNCATE TABLE pet_vectors RESTART IDENTITY CASCADE;"))
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(
                f"No se pudo truncar la tabla pet_vectors (puede estar vacía): {e}"
            )

        total_mascotas = await self.pet_repo.count_all()
        if total_mascotas == 0:
            return {"message": "No hay mascotas para sincronizar", "procesados": 0}

        registros_procesados = 0

        for offset in range(0, total_mascotas, batch_size):
            mascotas_batch = await self.pet_repo.get_paginated(
                offset=offset, limit=batch_size
            )

            for pet in mascotas_batch:
                try:
                    exito = await self.reindex_pet(pet)
                    if exito:
                        registros_procesados += 1
                    else:
                        logger.warning(
                            f"No se pudo ingestar el vector para la mascota ID {getattr(pet, 'id', 'desconocido')}"
                        )
                except Exception as err:
                    pet_id_str = getattr(pet, "id", "desconocido")
                    logger.error(f"Error reindexando mascota ID {pet_id_str}: {err}")

        return {
            "status": "success",
            "message": f"Se sincronizaron correctamente {registros_procesados} mascotas en pgvector.",
            "total_mascotas": total_mascotas,
        }