import uuid
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.historia_clinica import HistoriaClinica
from app.models.user import User
from app.schemas.historia_clinica import HistoriaClinicaCreate
from app.repositories.historia_clinica_repository import HistoriaClinicaRepository
from app.factories.historia_clinica_factory import HistoriaClinicaExportFactory, ExportFormat

class HistoriaClinicaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = HistoriaClinicaRepository(db)

    async def registrar_consulta(
        self, 
        data: HistoriaClinicaCreate, 
        veterinario: User
    ) -> HistoriaClinica:
        """Crea un nuevo registro médico asignando el ID del veterinario autenticado."""
        
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
        
        return await self.repository.create(nueva_historia)

    async def obtener_por_mascota(self, mascota_id: uuid.UUID) -> List[HistoriaClinica]:
        """Obtiene el historial clínico completo de una mascota."""
        return await self.repository.get_by_mascota(mascota_id)

    async def exportar_historia_clinica(
        self, 
        historia_id: uuid.UUID, 
        formato: ExportFormat
    ) -> Dict[str, Any]:
        """
        Orquesta la selección de la Strategy adecuada usando la Factory
        y ejecuta la exportación del registro médico.
        """
        historia = await self.repository.get_by_id(historia_id)
        if not historia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Historia clínica no encontrada."
            )

        # 1. Usamos la Factory para obtener la estrategia requerida
        strategy = HistoriaClinicaExportFactory.get_strategy(formato)
        
        # 2. Ejecutamos el algoritmo de exportación correspondiente
        return await strategy.exportar(historia)