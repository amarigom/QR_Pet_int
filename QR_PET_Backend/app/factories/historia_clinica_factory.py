# app/factories/historia_clinica_factory.py
from enum import Enum
from app.strategies.historia_clinica_strategy import (
    HistoriaClinicaExportStrategy,
    PDFExportStrategy,
    EmailNotificationStrategy,
    JSONExportStrategy
)

class ExportFormat(str, Enum):
    PDF = "pdf"
    EMAIL = "email"
    JSON = "json"

class HistoriaClinicaExportFactory:
    _strategies = {
        ExportFormat.PDF: PDFExportStrategy,
        ExportFormat.EMAIL: EmailNotificationStrategy,
        ExportFormat.JSON: JSONExportStrategy
    }

    @classmethod
    def get_strategy(cls, format_type: ExportFormat) -> HistoriaClinicaExportStrategy:
        strategy_class = cls._strategies.get(format_type)
        if not strategy_class:
            raise ValueError(f"Formato de exportación '{format_type}' no soportado.")
        return strategy_class()