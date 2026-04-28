import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Esquemas (Atómicos y Compuestos)
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.schemas.composite import PetDetailResponse  # <--- La "Vista" con relaciones
from app.schemas.common import SuccessResponse

# 2. Core, Seguridad y Modelos
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.services.pet_service import PetService

router = APIRouter(prefix="/pets", tags=["Mascotas"])

@router.post("", response_model=PetDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet_data: PetCreate, 
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Crea una nueva mascota vinculada al usuario actual."""
    pet_service = PetService(db)
    return await pet_service.create_pet(user.id, pet_data)

@router.get("", response_model=dict)
async def get_pets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):  
    """Obtiene el listado paginado de mascotas del usuario."""
    pet_service = PetService(db)
    return await pet_service.get_user_pets(user.id, page, limit)

@router.get("/{pet_id}", response_model=PetDetailResponse)
async def get_pet(
    pet_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene detalles completos de una mascota específica."""
    pet_service = PetService(db)
    return await pet_service.get_pet(user.id, pet_id)

@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: uuid.UUID,
    pet_data: PetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualiza datos de una mascota (PATCH)."""
    pet_service = PetService(db)
    return await pet_service.update_pet(user.id, pet_id, pet_data)

@router.delete("/{pet_id}", response_model=SuccessResponse)
async def delete_pet(
    pet_id: uuid.UUID, 
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Elimina permanentemente una mascota y sus registros asociados."""
    pet_service = PetService(db)
    await pet_service.delete_pet(user.id, pet_id)
    return SuccessResponse(message="Mascota eliminada correctamente")