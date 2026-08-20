import uuid
from fastapi import APIRouter, Depends, Query, status

# 1. Esquemas
from app.schemas.pet import PetCreate, PetUpdate
from app.schemas.composite import PetDetailResponse
from app.schemas.common import SuccessResponse
from app.schemas.user import UserDashboardStats

# 2. Seguridad, Modelos y Dependencias de Servicios
from app.api.v1.dependencies import (
    get_current_user,
    get_pet_service,
    get_admin_service
)
from app.models.user import User
from app.services.pet_service import PetService
from app.services.admin_service import AdminService

router = APIRouter(prefix="/pets", tags=["Mascotas"])


@router.post("", response_model=PetDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet_data: PetCreate, 
    user: User = Depends(get_current_user), 
    pet_service: PetService = Depends(get_pet_service)
):
    """Crea una nueva mascota vinculada al usuario e indexa sus vectores."""
    return await pet_service.create_pet(user.id, pet_data)


@router.get("", response_model=dict)
async def get_pets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service)
):  
    """Obtiene el listado paginado de mascotas del usuario."""
    return await pet_service.get_user_pets(user.id, page, limit)


@router.get("/search/similar")
async def search_similar_pets(
    query: str = Query(..., description="Descripción semántica (ej: 'perro mestizo negro peludo')"),
    limit: int = Query(5, ge=1, le=20),
    pet_service: PetService = Depends(get_pet_service)
):
    """Busca mascotas por similitud vectorial en ChromaDB."""
    return await pet_service.search_similar_pets(query=query, limit=limit)


@router.get("/stats/summary", response_model=UserDashboardStats)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service)
):
    """Retorna las estadísticas del dashboard del usuario."""
    return await pet_service.get_user_stats(current_user.id)


@router.get("/{pet_id}", response_model=PetDetailResponse)
async def get_pet(
    pet_id: uuid.UUID,
    user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
    admin_service: AdminService = Depends(get_admin_service)
):
    """Obtiene detalles completos de una mascota (permite acceso extendido a admins)."""
    if user.rol == "admin":
        return await admin_service.get_pet_detail_admin(pet_id)
    
    return await pet_service.get_pet(user, pet_id)


@router.patch("/{pet_id}", response_model=PetDetailResponse)
async def update_pet(
    pet_id: uuid.UUID,
    pet_data: PetUpdate,
    user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service)
):
    """Actualiza datos de una mascota y actualiza su representación en ChromaDB."""
    return await pet_service.update_pet(user.id, pet_id, pet_data)


@router.delete("/{pet_id}", response_model=SuccessResponse)
async def delete_pet(
    pet_id: uuid.UUID, 
    user: User = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service)
):
    """Elimina permanentemente una mascota en PostgreSQL y ChromaDB."""
    await pet_service.delete_pet(user.id, pet_id)
    return SuccessResponse(message="Mascota eliminada correctamente")