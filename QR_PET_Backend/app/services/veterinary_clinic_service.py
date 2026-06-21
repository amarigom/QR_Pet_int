"""
Servicio para Clínicas Veterinarias
Patrón: Repository-Service sin dependencias circulares
"""
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.veterinary_clinic_repository import VeterinaryClinicRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.schemas.veterinary_clinic import (
    VeterinaryClinicCreate,
    VeterinaryClinicUpdate,
    VeterinaryClinicResponse,
    VeterinaryClinicDetailResponse,
)
from app.core.constants import UserRole


class VeterinaryClinicService:
    """Servicio para gestionar clínicas veterinarias"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.clinic_repo = VeterinaryClinicRepository(db)
        self.user_repo = UserRepository(db)

    async def create_clinic(
        self,
        admin_id: uuid.UUID,
        clinic_data: VeterinaryClinicCreate
    ) -> VeterinaryClinicDetailResponse:
        """
        Crea una nueva clínica veterinaria
        Solo ADMIN o superior pueden crear clínicas
        """
        # Verificar que el admin existe y tiene permisos
        admin = await self.user_repo.get_by_id(admin_id)
        if not admin:
            raise ResourceNotFoundException("Administrador")

        # Validar rol
        if admin.rol not in [UserRole.ADMIN, UserRole.ADMIN_GENERAL, UserRole.SUPERADMIN]:
            raise ValidationException("Solo administradores pueden crear clínicas")

        # Verificar que el email no existe
        existing = await self.clinic_repo.get_by_email(clinic_data.email)
        if existing:
            raise ValidationException("El email de la clínica ya está registrado")

        # Crear clínica
        new_clinic = await self.clinic_repo.create(
            admin_id=admin_id,
            **clinic_data.model_dump()
        )
        await self.db.commit()

        # Recargar con relaciones
        clinic = await self.clinic_repo.get_by_id(new_clinic.id)
        if not clinic:
            raise ResourceNotFoundException("Clínica recién creada")

        return VeterinaryClinicDetailResponse.model_validate(clinic)

    async def get_clinic(self, clinic_id: uuid.UUID) -> VeterinaryClinicDetailResponse:
        """Obtiene detalles de una clínica con sus veterinarios"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)

        if not clinic:
            raise ResourceNotFoundException("Clínica")

        return VeterinaryClinicDetailResponse.model_validate(clinic)

    async def get_clinics_by_admin(
        self,
        admin_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene clínicas administradas por un admin específico"""
        clinics = await self.clinic_repo.get_by_admin_id(admin_id)

        return {
            "items": [VeterinaryClinicResponse.model_validate(c) for c in clinics],
            "total": len(clinics),
        }

    async def get_all_clinics(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Listado de todas las clínicas (solo para ADMIN_GENERAL o superior)"""
        clinics = await self.clinic_repo.get_all_with_veterinarians(limit, offset)
        total = await self.clinic_repo.count_all_clinics()

        return {
            "items": [VeterinaryClinicResponse.model_validate(c) for c in clinics],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    async def update_clinic(
        self,
        clinic_id: uuid.UUID,
        admin_id: uuid.UUID,
        clinic_data: VeterinaryClinicUpdate
    ) -> VeterinaryClinicDetailResponse:
        """Actualiza datos de una clínica (solo admin que la creó)"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)

        if not clinic:
            raise ResourceNotFoundException("Clínica")

        # Validar que el admin que la creó sea quien actualiza
        if clinic.admin_id != admin_id:
            raise ValidationException("No tienes permiso para actualizar esta clínica")

        # Actualizar datos
        update_dict = clinic_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(clinic, key, value)

        await self.db.commit()

        # Recargar
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        return VeterinaryClinicDetailResponse.model_validate(clinic)

    async def delete_clinic(
        self,
        clinic_id: uuid.UUID,
        admin_id: uuid.UUID
    ) -> bool:
        """Elimina una clínica (solo admin que la creó)"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)

        if not clinic:
            raise ResourceNotFoundException("Clínica")

        if clinic.admin_id != admin_id:
            raise ValidationException("No tienes permiso para eliminar esta clínica")

        success = await self.clinic_repo.delete(clinic_id)
        await self.db.commit()
        return success

    async def search_clinics_by_location(
        self,
        lat: float,
        lon: float,
        radius_km: float = 10.0
    ) -> List[VeterinaryClinicResponse]:
        """Busca clínicas cerca de una ubicación"""
        clinics = await self.clinic_repo.search_by_location(lat, lon, radius_km)

        return [VeterinaryClinicResponse.model_validate(c) for c in clinics]

    async def get_clinic_veterinarians_count(self, clinic_id: uuid.UUID) -> int:
        """Cuenta veterinarios en una clínica"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)

        if not clinic:
            raise ResourceNotFoundException("Clínica")

        return await self.clinic_repo.count_veterinarians(clinic_id)

    async def get_clinic_stats(self, clinic_id: uuid.UUID) -> Dict[str, Any]:
        """Obtiene estadísticas de una clínica"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)

        if not clinic:
            raise ResourceNotFoundException("Clínica")

        vet_count = await self.clinic_repo.count_veterinarians(clinic_id)

        return {
            "clinic_id": clinic_id,
            "nombre": clinic.nombre,
            "veterinarians_count": vet_count,
            "created_at": clinic.created_at,
        }
