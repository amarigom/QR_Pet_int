import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.pet_repository import PetRepository
from app.repositories.qr_repository import QRRepository
from app.core.exceptions import ResourceNotFoundException
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.schemas.composite import PetDetailResponse

class PetService:
    """Service para gestionar el ciclo de vida de las mascotas"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.pet_repo = PetRepository(db)
        self.qr_repo = QRRepository(db)
    
    async def create_pet(self, user_id: uuid.UUID, pet_data: PetCreate) -> PetDetailResponse:
        """Crea una mascota y confirma la transacción"""
        new_pet = await self.pet_repo.create(
            usuario_id=user_id,
            **pet_data.model_dump()
        )
        await self.db.commit()
        
        # Recargamos con relaciones para el esquema Detail
        pet_full = await self.pet_repo.get_by_id(new_pet.id)
        if not pet_full:
            raise ResourceNotFoundException("Mascota recién creada")
        
        return PetDetailResponse.model_validate(pet_full)
    
    async def get_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID) -> PetDetailResponse:
        """Obtiene detalles de una mascota validando propiedad"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")
        
        return PetDetailResponse.model_validate(pet)
    
    async def get_user_pets(self, user_id: uuid.UUID, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Listado paginado de mascotas del usuario"""
        offset = (page - 1) * limit
        pets = await self.pet_repo.get_by_user(user_id, limit, offset)
        total = await self.pet_repo.count_by_user(user_id)
        
        return {
            "items": [PetResponse.model_validate(p) for p in pets],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }
    
    async def update_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID, pet_data: PetUpdate) -> PetResponse:
        """Actualiza datos de la mascota usando estilo ORM"""
        pet = await self.pet_repo.get_by_id(pet_id)
    
        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")
    
        update_dict = pet_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(pet, key, value)
    
        await self.db.commit()
        await self.db.refresh(pet)
    
        return PetResponse.model_validate(pet)
    
    async def delete_pet(self, user_id: uuid.UUID, pet_id: uuid.UUID) -> bool:
        """Elimina una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet or pet.usuario_id != user_id:
            raise ResourceNotFoundException("Mascota")
        
        success = await self.pet_repo.delete(pet_id)
        await self.db.commit()
        return success