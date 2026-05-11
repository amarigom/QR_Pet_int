"""
Módulo de esquemas Pydantic.

ORDEN DE IMPORTACIÓN (CRÍTICO):
1. base.py - Esquemas base sin dependencias
2. common.py - Re-exporta base.py (para backwards compatibility)
3. Esquemas individuales (user.py, pet.py, qr.py, scan.py)
4. composite.py - Vistas compuestas (ÚLTIMO porque importa todo)

Esto garantiza que NO haya dependencias circulares.
"""

# Importar en orden correcto
from app.schemas.base import (
    UserMinimal,
    PetMinimal,
    ScanMinimal,
    QRMinimal,
    UserBase,
    PetBase,
    ScanBase,
    QRBase,
    MessageResponse,
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
)

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    TokenResponse,
    DashboardStats,
    UserDashboardStats,
)

from app.schemas.pet import (
    PetCreate,
    PetUpdate,
    PetResponse,
)

from app.schemas.qr import (
    QRCreate,
    QRResponse,
    QRActivateData,
    QRCheckResponse,
)

from app.schemas.scan import (
    ScanCreate,
    ScanUpdate,
    ScanResponse,
    ScanWithUserResponse,
    ScanAdminResponse,
    ScanLocation,
)

from app.schemas.composite import (
    PetWithOwner,
    PetDetailResponse,
    UserWithPets,
    QRDetailResponse,
    ScanDetailResponse,
    UserProfile,
)

__all__ = [
    # Base types
    "UserMinimal",
    "PetMinimal",
    "ScanMinimal",
    "QRMinimal",
    "UserBase",
    "PetBase",
    "ScanBase",
    "QRBase",
    # Common/Generic
    "MessageResponse",
    "SuccessResponse",
    "ErrorResponse",
    "PaginatedResponse",
    "TokenResponse",
    # User schemas
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "DashboardStats",
    "UserDashboardStats",
    # Pet schemas
    "PetCreate",
    "PetUpdate",
    "PetResponse",
    # QR schemas
    "QRCreate",
    "QRResponse",
    "QRActivateData",
    "QRCheckResponse",
    # Scan schemas
    "ScanCreate",
    "ScanUpdate",
    "ScanResponse",
    "ScanWithUserResponse",
    "ScanAdminResponse",
    "ScanLocation",
    # Composite schemas
    "PetWithOwner",
    "PetDetailResponse",
    "UserWithPets",
    "QRDetailResponse",
    "ScanDetailResponse",
    "UserProfile",
]
