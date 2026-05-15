"""
Módulo común: Re-exporta esquemas base para backwards compatibility.

NOTA: Este módulo ahora actúa como un proxy que re-exporta elementos de base.py.
Esto mantiene la compatibilidad con código existente mientras evita dependencias circulares.
"""

# Re-exportar desde base.py para mantener compatibilidad
from app.schemas.base import (
    MessageResponse,
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
    UserMinimal,
    ScanMinimal,
    QRMinimal,
    PetMinimal,
    
)

__all__ = [
    "MessageResponse",
    "SuccessResponse",
    "ErrorResponse",
    "PaginatedResponse",
    "UserMinimal",
    "ScanMinimal",
    "QRMinimal",
    "PetMinimal",
    
]
