# app/strategies/historia_clinica_strategy.py
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.historia_clinica import HistoriaClinica

class HistoriaClinicaExportStrategy(ABC):
    @abstractmethod
    async def exportar(self, historia: HistoriaClinica) -> Dict[str, Any]:
        """Procesa y exporta la historia clínica en el formato correspondiente."""
        pass


class PDFExportStrategy(HistoriaClinicaExportStrategy):
    async def exportar(self, historia: HistoriaClinica) -> Dict[str, Any]:
        # Lógica para construir y formatear el documento PDF
        return {
            "format": "pdf",
            "content_type": "application/pdf",
            "filename": f"historia_clinica_{historia.id}.pdf",
            "payload": f"Generando reporte PDF para la consulta del {historia.fecha_consulta}..."
        }


class EmailNotificationStrategy(HistoriaClinicaExportStrategy):
    async def exportar(self, historia: HistoriaClinica) -> Dict[str, Any]:
        # Lógica para preparar el envío de correo al dueño
        return {
            "format": "email",
            "status": "queued",
            "detail": f"Notificación por email preparada para enviar al cliente."
        }


class JSONExportStrategy(HistoriaClinicaExportStrategy):
    async def exportar(self, historia: HistoriaClinica) -> Dict[str, Any]:
        return {
            "format": "json",
            "content_type": "application/json",
            "data": {
                "id": str(historia.id),
                "motivo": historia.motivo_consulta,
                "diagnostico": historia.diagnostico,
                "tratamiento": historia.tratamiento
            }
        }