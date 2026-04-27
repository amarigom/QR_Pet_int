from typing import Dict, Any, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

# Repositorios
from app.repositories.user_repository import UserRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.qr_repository import QRRepository

# Schemas y Helpers
from app.schemas.user import UserResponse
from app.core.exceptions import ResourceNotFoundException, InvalidDataException
from app.core.constants import MESSAGE_CANNOT_DELETE_SELF

class AdminService:
    
    def __init__(self, db: AsyncSession):
        self.db = db
        # Centralizamos el acceso a datos en los repositorios
        self.user_repo = UserRepository(db)
        self.pet_repo = PetRepository(db) 
        self.qr_repo = QRRepository(db)

    async def get_all_users(self, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Obtiene usuarios delegando la paginación al BaseRepository"""
        offset = (page - 1) * limit
        
        # Usamos el list() genérico del BaseRepository
        users = await self.user_repo.list(limit=limit, offset=offset)
        total = await self.user_repo.count()
        
        return {
            "items": [UserResponse.model_validate(u) for u in users],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }

    async def get_all_pets(self, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Obtiene todas las mascotas usando la carga profunda del PetRepository"""
        offset = (page - 1) * limit
        
        # Usamos el método que ya tiene los joins optimizados
        pets = await self.pet_repo.get_all_with_owner(limit=limit, offset=offset)
        total = await self.pet_repo.count()
        
        return {
            "items": [
                {
                    "id": str(p.id),
                    "nombre": p.nombre,
                    "especie": p.especie,
                    "owner_name": p.owner.nombre if p.owner else "Sin dueño",
                    "estado": p.estado,
                    "created_at": p.created_at
                } for p in pets
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }

    async def delete_user(self, admin_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Elimina un usuario y confirma la transacción"""
        if admin_id == user_id:
            raise InvalidDataException(MESSAGE_CANNOT_DELETE_SELF)
            
        success = await self.user_repo.delete(user_id)
        if not success:
            raise ResourceNotFoundException("Usuario")
            
        # El Service es el único que hace COMMIT
        await self.db.commit()
        return True

    async def get_pet_detail_admin(self, pet_id: uuid.UUID) -> Dict[str, Any]:
        """Detalle completo de mascota para administración"""
        # 1. Buscamos mascota con dueño cargado
        pet = await self.pet_repo.get_by_id_with_owner(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # 2. Buscamos el QR
        qr = await self.qr_repo.get_by_mascota(pet.id)
        
        return {
            "id": str(pet.id),
            "nombre": pet.nombre,
            "datos_dueño": {
                "nombre": pet.owner.nombre if pet.owner else "N/A",
                "email": pet.owner.email if pet.owner else "N/A"
            },
            "qr": {
                "id": str(qr.id) if qr else None,
                "codigo": qr.codigo if qr else None
            } if qr else None,
            "created_at": pet.created_at
        }
    async def get_dashboard_stats(self) -> dict:
        total_users = await self.user_repo.count()
        total_pets = await self.pet_repo.count()
        total_qrs = await self.qr_repo.count()
        # Si aún no tienes scans, ponle 0 por ahora para que no falle la validación
        total_scans = 0 

        return {
            "users_count": total_users,  # Antes era total_users
            "pets_count": total_pets,    # Antes era total_pets
            "qrs_count": total_qrs,      # Antes era total_qrs
            "scans_count": total_scans,  # Este campo es obligatorio según tu error
            "timestamp": datetime.utcnow()
        }