"""
Servicio para Citas/Turnos Veterinarios
"""
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.veterinary_clinic_repository import VeterinaryClinicRepository
from app.repositories.user_repository import UserRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from app.core.constants import UserRole


class AppointmentService:
    """Servicio para gestionar citas veterinarias"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.appointment_repo = AppointmentRepository(db)
        self.pet_repo = PetRepository(db)
        self.clinic_repo = VeterinaryClinicRepository(db)
        self.user_repo = UserRepository(db)

    async def create_appointment(
        self,
        pet_id: uuid.UUID,
        clinic_id: uuid.UUID,
        appointment_data: AppointmentCreate
    ) -> AppointmentResponse:
        """
        Crea una nueva cita
        Valida que mascota y clínica existan
        """
        # Verificar mascota
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Verificar clínica
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ResourceNotFoundException("Clínica")

        # Validar que la fecha sea futura
        if appointment_data.fecha_programada < datetime.utcnow():
            raise ValidationException("La fecha de la cita debe ser futura")

        # Si hay veterinario asignado, validar que existe
        if appointment_data.veterinarian_id:
            vet = await self.user_repo.get_by_id(appointment_data.veterinarian_id)
            if not vet or vet.veterinary_clinic_id != clinic_id:
                raise ValidationException("Veterinario no disponible en esta clínica")

        # Crear cita
        new_appointment = await self.appointment_repo.create(
            pet_id=pet_id,
            veterinary_clinic_id=clinic_id,
            **appointment_data.model_dump()
        )
        await self.db.commit()

        appointment = await self.appointment_repo.get_by_id(new_appointment.id)
        if not appointment:
            raise ResourceNotFoundException("Cita recién creada")

        return AppointmentResponse.model_validate(appointment)

    async def get_appointment(self, appointment_id: uuid.UUID) -> AppointmentResponse:
        """Obtiene detalles de una cita"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)

        if not appointment:
            raise ResourceNotFoundException("Cita")

        return AppointmentResponse.model_validate(appointment)

    async def get_pet_appointments(
        self,
        pet_id: uuid.UUID,
        include_past: bool = False,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene citas de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        appointments = await self.appointment_repo.get_by_pet_id(
            pet_id,
            include_past=include_past,
            limit=limit,
            offset=offset
        )

        return {
            "items": [AppointmentResponse.model_validate(a) for a in appointments],
            "pet_id": pet_id,
            "pet_name": pet.nombre,
        }

    async def get_next_appointment(self, pet_id: uuid.UUID) -> Optional[AppointmentResponse]:
        """Obtiene la próxima cita de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        appointment = await self.appointment_repo.get_next_appointment(pet_id)

        return AppointmentResponse.model_validate(appointment) if appointment else None

    async def get_clinic_appointments(
        self,
        clinic_id: uuid.UUID,
        estado: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene citas de una clínica"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ResourceNotFoundException("Clínica")

        appointments = await self.appointment_repo.get_by_clinic(
            clinic_id,
            estado=estado,
            limit=limit,
            offset=offset
        )

        return {
            "items": [AppointmentResponse.model_validate(a) for a in appointments],
            "clinic_id": clinic_id,
            "clinic_name": clinic.nombre,
        }

    async def get_veterinarian_appointments(
        self,
        veterinarian_id: uuid.UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Obtiene citas de un veterinario en un rango de fechas"""
        vet = await self.user_repo.get_by_id(veterinarian_id)
        if not vet or vet.veterinary_clinic_id is None:
            raise ResourceNotFoundException("Veterinario")

        appointments = await self.appointment_repo.get_by_veterinarian(
            veterinarian_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )

        return {
            "items": [AppointmentResponse.model_validate(a) for a in appointments],
            "veterinarian_id": veterinarian_id,
            "veterinarian_name": vet.nombre,
        }

    async def get_pending_appointments(
        self,
        clinic_id: uuid.UUID,
        days_ahead: int = 7
    ) -> List[AppointmentResponse]:
        """Obtiene citas pendientes en los próximos N días"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ResourceNotFoundException("Clínica")

        appointments = await self.appointment_repo.get_pending_appointments(
            clinic_id,
            days_ahead=days_ahead
        )

        return [AppointmentResponse.model_validate(a) for a in appointments]

    async def update_appointment(
        self,
        appointment_id: uuid.UUID,
        appointment_data: AppointmentUpdate
    ) -> AppointmentResponse:
        """Actualiza una cita"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)

        if not appointment:
            raise ResourceNotFoundException("Cita")

        update_dict = appointment_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(appointment, key, value)

        await self.db.commit()

        appointment = await self.appointment_repo.get_by_id(appointment_id)
        return AppointmentResponse.model_validate(appointment)

    async def confirm_appointment(self, appointment_id: uuid.UUID) -> AppointmentResponse:
        """Confirma una cita pendiente"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)

        if not appointment:
            raise ResourceNotFoundException("Cita")

        if appointment.estado != "pendiente":
            raise ValidationException("Solo citas pendientes pueden ser confirmadas")

        appointment.estado = "confirmado"
        await self.db.commit()

        appointment = await self.appointment_repo.get_by_id(appointment_id)
        return AppointmentResponse.model_validate(appointment)

    async def cancel_appointment(
        self,
        appointment_id: uuid.UUID,
        razon: Optional[str] = None
    ) -> AppointmentResponse:
        """Cancela una cita"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)

        if not appointment:
            raise ResourceNotFoundException("Cita")

        if appointment.estado == "cancelado":
            raise ValidationException("La cita ya está cancelada")

        if appointment.estado == "completado":
            raise ValidationException("No se puede cancelar una cita completada")

        appointment.estado = "cancelado"
        if razon:
            appointment.notas_posteriores = razon

        await self.db.commit()

        appointment = await self.appointment_repo.get_by_id(appointment_id)
        return AppointmentResponse.model_validate(appointment)

    async def complete_appointment(
        self,
        appointment_id: uuid.UUID,
        notas: Optional[str] = None
    ) -> AppointmentResponse:
        """Marca una cita como completada"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)

        if not appointment:
            raise ResourceNotFoundException("Cita")

        if appointment.estado == "cancelado":
            raise ValidationException("No se puede completar una cita cancelada")

        appointment.estado = "completado"
        if notas:
            appointment.notas_posteriores = notas

        await self.db.commit()

        appointment = await self.appointment_repo.get_by_id(appointment_id)
        return AppointmentResponse.model_validate(appointment)

    async def get_available_slots(
        self,
        clinic_id: uuid.UUID,
        fecha: datetime,
        duracion_minutos: int = 30
    ) -> List[tuple]:
        """Obtiene slots disponibles en una fecha"""
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ResourceNotFoundException("Clínica")

        slots = await self.appointment_repo.get_available_slots(
            clinic_id,
            fecha,
            duracion_minutos
        )

        return slots

    async def delete_appointment(self, appointment_id: uuid.UUID) -> bool:
        """Elimina una cita"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)

        if not appointment:
            raise ResourceNotFoundException("Cita")

        success = await self.appointment_repo.delete(appointment_id)
        await self.db.commit()
        return success
