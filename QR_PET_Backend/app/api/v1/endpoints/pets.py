import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import TYPE_CHECKING

# Importaciones locales (solo las que no causan círculos)
from app.core.database import get_db
from app.schemas.common import SuccessResponse
from app.api.v1.dependencies import get_current_user

if TYPE_CHECKING:
    from app.schemas.pet import PetCreate, PetUpdate, PetResponse, PetDetailResponse
    from app.models.user import User

# Definimos el router
router = APIRouter(prefix="/pets", tags=["Mascotas"])

@router.post("", response_model="PetDetailResponse", status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet_data: "PetCreate", 
    user: "User" = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Crea una nueva mascota vinculada al usuario actual."""
    from app.services.pet_service import PetService
    from app.schemas.pet import PetCreate, PetDetailResponse
    
    pet_service = PetService(db)
    return await pet_service.create_pet(user.id, pet_data)

@router.get("", response_model=dict)
async def get_pets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: "User" = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):  
    """Obtiene el listado paginado de mascotas del usuario."""
    from app.services.pet_service import PetService
    
    pet_service = PetService(db)
    return await pet_service.get_user_pets(user.id, page, limit)

@router.get("/{pet_id}", response_model="PetDetailResponse")
async def get_pet(
    pet_id: uuid.UUID,
    user: "User" = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene detalles completos de una mascota específica."""
    from app.services.pet_service import PetService
    from app.schemas.pet import PetDetailResponse
    
    pet_service = PetService(db)
    return await pet_service.get_pet(user.id, pet_id)

@router.patch("/{pet_id}", response_model="PetResponse")
async def update_pet(
    pet_id: uuid.UUID,
    pet_data: "PetUpdate",
    user: "User" = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualiza datos de una mascota (PATCH)."""
    from app.services.pet_service import PetService
    from app.schemas.pet import PetUpdate, PetResponse
    
    pet_service = PetService(db)
    return await pet_service.update_pet(user.id, pet_id, pet_data)

@router.delete("/{pet_id}", response_model=SuccessResponse)
async def delete_pet(
    pet_id: uuid.UUID, 
    user: "User" = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Elimina permanentemente una mascota y sus registros asociados."""
    from app.services.pet_service import PetService
    
    pet_service = PetService(db)
    await pet_service.delete_pet(user.id, pet_id)
    return SuccessResponse(message="Mascota eliminada correctamente")