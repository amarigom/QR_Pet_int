import uuid
import asyncio
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.pet_repository import PetRepository
from app.repositories.qr_repository import QRRepository
from app.core.exceptions import ResourceNotFoundException
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.schemas.composite import PetDetailResponse
from app.schemas.user import UserDashboardStats

class PetService:
    """Service para gestionar el ciclo de vida de las mascotas y sus estadísticas"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.pet_repo = PetRepository(db)
        self.qr_repo = QRRepository(db)
    
    async def get_user_stats(self, user_id: uuid.UUID) -> Dict[str, int]:
        """
        Obtiene las estadísticas del dashboard delegando en el repositorio.
        
        """
        total_pets = await self.pet_repo.count_user_pets(user_id)
        active_qrs = await self.pet_repo.count_user_active_qrs(user_id)
        total_scans = await self.pet_repo.count_user_scans(user_id)
        

        return {
        "pets_count": total_pets,    # Antes era total_pets
        "qrs_count": active_qrs,     # Antes era active_qrs
        "scans_count": total_scans,  # Antes era total_scans_received
        "recent_scans": []
        }
    

    async def create_pet(self, user_id: uuid.UUID, pet_data: PetCreate) -> PetDetailResponse:
        """Crea una mascota vinculada al usuario actual"""
        new_pet = await self.pet_repo.create(
            owner_id=user_id,
            **pet_data.model_dump()
        )
        await self.db.commit()
        
        # Recargamos con relaciones (owner, qr_code) para el esquema Detail
        pet_full = await self.pet_repo.get_by_id(new_pet.id)
        if not pet_full:
            raise ResourceNotFoundException("Mascota recién creada")
        
        return PetDetailResponse.model_validate(pet_full)
    
    async def get_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID) -> PetDetailResponse:
        """Obtiene detalles de una mascota validando propiedad"""
        pet = await self.pet_repo.get_by_id(pet_id)
        
        # Validación de seguridad: debe existir y pertenecer al usuario
        if not pet or pet.owner_id != user_id:
            raise ResourceNotFoundException("Mascota")
        
        return PetDetailResponse.model_validate(pet)
    
    
    async def get_user_pets(self, user_id: uuid.UUID, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Listado paginado de mascotas del usuario con ejecución secuencial segura"""
        offset = (page - 1) * limit
    
    # 1. Primero buscamos los datos de las mascotas
        pets = await self.pet_repo.get_by_user(user_id, limit, offset)
    
    # 2. Luego contamos el total (una vez que la sesión anterior se liberó)
        total = await self.pet_repo.count_user_pets(user_id)
    
        return {
            "items": [PetResponse.model_validate(p) for p in pets],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    
        
    
    async def update_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID, pet_data: PetUpdate) -> PetResponse:
        """Actualiza datos de la mascota validando propiedad"""
        pet = await self.pet_repo.get_by_id(pet_id)
    
        if not pet or pet.owner_id != user_id:
            raise ResourceNotFoundException("Mascota")
    
        update_dict = pet_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(pet, key, value)
    
        await self.db.commit()
        await self.db.refresh(pet)
    
        return PetResponse.model_validate(pet)
    
    async def delete_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID) -> bool:
        """Elimina una mascota validando propiedad"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet or pet.owner_id != user_id:
            raise ResourceNotFoundException("Mascota")
        
        success = await self.pet_repo.delete(pet_id)
        await self.db.commit()
        return success