import uuid
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.historia_clinica import HistoriaClinica
from app.models.user import User
from app.schemas.historia_clinica import HistoriaClinicaCreate
from app.repositories.historia_clinica_repository import HistoriaClinicaRepository
from app.repositories.turno_repository import TurnoRepository
from app.factories.historia_clinica_factory import HistoriaClinicaExportFactory, ExportFormat
from app.services.pgvector_service import VectorStoreService

logger = logging.getLogger("uvicorn.error")

class HistoriaClinicaService:
    def __init__(
        self, db: AsyncSession, vector_service: Optional[VectorStoreService] = None
    ):
        self.db = db
        self.repository = HistoriaClinicaRepository(db)
        self.turno_repository = TurnoRepository(db)
        self.vector_service = vector_service

    async def registrar_consulta(
        self, 
        data: HistoriaClinicaCreate, 
        veterinario: User
    ) -> HistoriaClinica:
        """Crea un nuevo registro médico asignando el ID del veterinario autenticado."""
        if not await self.turno_repository.has_veterinarian_patient(
            veterinario.id, data.mascota_id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mascota no asignada a este veterinario.",
            )
        
        # Instanciamos el modelo del ORM desde el schema de Pydantic
        nueva_historia = HistoriaClinica(
            veterinario_id=veterinario.id,
            mascota_id=data.mascota_id,
            motivo_consulta=data.motivo_consulta,
            diagnostico=data.diagnostico,
            tratamiento=data.tratamiento,
            peso_kg=data.peso_kg,
            temperatura_c=data.temperatura_c,
            adjuntos=data.adjuntos or []
        )
        
        nueva_historia = await self.repository.create(nueva_historia)
        await self._vectorize_record(nueva_historia)
        return nueva_historia

    async def vectorizar_historias_pendientes(
        self, veterinario: User, limit: int = 100
    ) -> dict[str, int]:
        if self.vector_service is None:
            raise RuntimeError("El servicio de vectores no está disponible.")
        records = await self.repository.get_pending_vectorization_by_veterinarian(
            veterinario.id, limit=limit
        )
        indexed = 0
        for record in records:
            if await self._vectorize_record(record):
                indexed += 1
        return {"procesadas": len(records), "vectorizadas": indexed, "pendientes": len(records) - indexed}

    async def _vectorize_record(self, record: HistoriaClinica) -> bool:
        if self.vector_service is None:
            logger.error("No se puede vectorizar la historia %s: servicio vectorial ausente.", record.id)
            return False
        content = "\n".join(
            part
            for part in (
                f"Historia clínica de mascota {record.mascota_id}",
                f"Fecha de consulta: {record.fecha_consulta.isoformat() if record.fecha_consulta else 'No registrada'}",
                f"Motivo: {record.motivo_consulta}",
                f"Diagnóstico: {record.diagnostico or 'No registrado'}",
                f"Tratamiento: {record.tratamiento or 'No registrado'}",
                f"Peso (kg): {record.peso_kg if record.peso_kg is not None else 'No registrado'}",
                f"Temperatura (°C): {record.temperatura_c if record.temperatura_c is not None else 'No registrada'}",
            )
        )
        success = await self.vector_service.ingestar_documento(
            chunk_id=f"medical-record-{record.id}",
            doc_id=f"medical-record-{record.id}",
            titulo=(
                f"Historia clínica · {record.fecha_consulta:%Y-%m-%d}"
                if record.fecha_consulta
                else "Historia clínica"
            ),
            contenido=content,
            categoria="historia_clinica",
            owner_type="veterinarian",
            owner_id=record.veterinario_id,
            pet_id=record.mascota_id,
            source_type="medical_record",
        )
        record.vectorizada = success
        await self.db.commit()
        if not success:
            logger.error("Falló la vectorización de la historia clínica %s.", record.id)
        return success

    async def obtener_por_mascota(
        self, mascota_id: uuid.UUID, veterinario: User
    ) -> List[HistoriaClinica]:
        """Obtiene el historial de la mascota para el veterinario asignado."""
        if not await self.turno_repository.has_veterinarian_patient(
            veterinario.id, mascota_id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mascota no asignada a este veterinario.",
            )
        return await self.repository.get_by_veterinarian_and_pet(
            veterinario.id, mascota_id
        )

    async def exportar_historia_clinica(
        self, 
        historia_id: uuid.UUID, 
        formato: ExportFormat,
        veterinario: User,
    ) -> Dict[str, Any]:
        """
        Orquesta la selección de la Strategy adecuada usando la Factory
        y ejecuta la exportación del registro médico.
        """
        historia = await self.repository.get_by_id(historia_id)
        if not historia or historia.veterinario_id != veterinario.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Historia clínica no encontrada."
            )

        # 1. Usamos la Factory para obtener la estrategia requerida
        strategy = HistoriaClinicaExportFactory.get_strategy(formato)
        
        # 2. Ejecutamos el algoritmo de exportación correspondiente
        return await strategy.exportar(historia)