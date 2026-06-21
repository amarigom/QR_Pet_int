"""
Factory Pattern para vincular Mascotas con Veterinarias
Evita duplicados y orquesta la lógica de carga de mascotas
"""
import uuid
from typing import Optional, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.pet_repository import PetRepository
from app.repositories.user_repository import UserRepository
from app.repositories.veterinary_clinic_repository import VeterinaryClinicRepository
from app.repositories.medical_record_repository import MedicalRecordRepository
from app.models.pet import Pet
from app.models.user import User
from app.models.medical_record import MedicalRecord
from app.core.exceptions import ValidationException, ResourceNotFoundException
from app.schemas.pet import PetCreate
from app.schemas.user import UserCreate


class PetVeterinaryLinkFactory:
    """
    Factory que maneja la lógica compleja de vincular mascotas con clínicas.
    Evita dependencias circulares usando orquestación.
    
    Flujos soportados:
    1. Veterinario carga mascota + dueño (si dueño no existe)
    2. Dueño escanea QR y carga mascota
    3. Dueño y veterinario colaboran en la carga (evitar duplicados)
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.pet_repo = PetRepository(db)
        self.user_repo = UserRepository(db)
        self.clinic_repo = VeterinaryClinicRepository(db)
        self.record_repo = MedicalRecordRepository(db)

    async def create_pet_by_veterinarian(
        self,
        clinic_id: uuid.UUID,
        veterinarian_id: uuid.UUID,
        pet_data: PetCreate,
        owner_data: UserCreate,
        owner_email: Optional[str] = None
    ) -> Tuple[Pet, User, MedicalRecord]:
        """
        Caso 1: Veterinario carga una mascota + datos del dueño
        
        Lógica:
        1. Verificar que la clínica existe
        2. Verificar que el veterinario pertenece a esa clínica
        3. Buscar si el dueño ya existe por email
        4. Si existe: reusar | Si no: crear
        5. Crear Pet vinculada al dueño
        6. Crear MedicalRecord inicial (vacío)
        7. Vincular MedicalRecord a la clínica
        
        Returns: (Pet, User/Owner, MedicalRecord)
        """
        # 1. Validar clínica
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ResourceNotFoundException("Clínica")

        # 2. Validar veterinario pertenece a la clínica
        vet = await self.user_repo.get_by_id(veterinarian_id)
        if not vet or vet.veterinary_clinic_id != clinic_id:
            raise ValidationException("Veterinario no pertenece a esta clínica")

        # 3. Buscar propietario existente
        owner_email_to_use = owner_email or owner_data.email
        owner = await self.user_repo.get_by_email(owner_email_to_use)

        # 4. Si no existe, crear propietario
        if not owner:
            owner = await self.user_repo.create(
                email=owner_email_to_use,
                nombre=owner_data.nombre,
                telefono=owner_data.telefono,
                rol="usuario"
            )
            await self.db.commit()
        else:
            # Verificar que el propietario existente es un usuario regular
            if owner.rol != "usuario":
                raise ValidationException(
                    "El email ya está asociado a una cuenta veterinaria"
                )

        # 5. Crear mascota
        pet = await self.pet_repo.create(
            usuario_id=owner.id,
            nombre=pet_data.nombre,
            especie=pet_data.especie,
            raza=pet_data.raza,
            color=pet_data.color,
            edad_aproximada=pet_data.edad_aproximada,
            foto_url=pet_data.foto_url,
            notas=pet_data.notas,
            estado=pet_data.estado
        )
        await self.db.commit()

        # 6. Crear MedicalRecord inicial
        medical_record = await self.record_repo.create(
            pet_id=pet.id,
            veterinary_clinic_id=clinic_id,
            veterinarian_id=veterinarian_id,
            tipo="consulta_inicial",
            descripcion="Mascota registrada por veterinario",
            fecha_registro=datetime.utcnow()
        )
        await self.db.commit()

        return pet, owner, medical_record

    async def create_pet_by_owner_scan(
        self,
        qr_codigo: str,
        pet_data: PetCreate,
        owner_data: UserCreate,
        owner_id: uuid.UUID
    ) -> Tuple[Pet, User, MedicalRecord]:
        """
        Caso 2: Dueño escanea QR y carga mascota
        
        Lógica:
        1. Validar que el QR existe y pertenece a una clínica
        2. Validar que el usuario es propietario (owner_id)
        3. Crear Pet
        4. Crear MedicalRecord vinculado a la clínica
        5. Notificar a la clínica (evento)
        
        Returns: (Pet, User/Owner, MedicalRecord)
        """
        # 1. Validar QR y obtener clínica
        qr = await self._get_qr_and_clinic(qr_codigo)
        if not qr:
            raise ResourceNotFoundException("QR code")
        
        clinic_id = qr.get("clinic_id")
        
        # 2. Validar propietario
        owner = await self.user_repo.get_by_id(owner_id)
        if not owner:
            raise ResourceNotFoundException("Usuario")
        
        if owner.rol != "usuario":
            raise ValidationException("Solo usuarios regulares pueden registrar mascotas")

        # 3. Crear mascota
        pet = await self.pet_repo.create(
            usuario_id=owner_id,
            nombre=pet_data.nombre,
            especie=pet_data.especie,
            raza=pet_data.raza,
            color=pet_data.color,
            edad_aproximada=pet_data.edad_aproximada,
            foto_url=pet_data.foto_url,
            notas=pet_data.notas,
            estado=pet_data.estado
        )
        await self.db.commit()

        # 4. Crear MedicalRecord
        medical_record = await self.record_repo.create(
            pet_id=pet.id,
            veterinary_clinic_id=clinic_id,
            tipo="consulta_inicial",
            descripcion="Mascota registrada por propietario escaneando QR",
            fecha_registro=datetime.utcnow()
        )
        await self.db.commit()

        # 5. Publicar evento (EventBus) para notificar a la clínica
        # Esto se maneja en la ReminderService via event-driven pattern
        
        return pet, owner, medical_record

    async def link_existing_pet_to_clinic(
        self,
        pet_id: uuid.UUID,
        clinic_id: uuid.UUID,
        veterinarian_id: uuid.UUID
    ) -> MedicalRecord:
        """
        Caso 3: Vincular una mascota existente a una clínica
        (Ej: El dueño cargó la mascota, ahora el vet la vincula a la clínica)
        
        Lógica:
        1. Validar que la mascota existe
        2. Validar que la clínica existe
        3. Validar que el vet pertenece a la clínica
        4. Buscar si ya existe MedicalRecord para esta mascota en esta clínica
        5. Si no: crear | Si sí: retornar existente
        
        Returns: MedicalRecord
        """
        # 1. Validar mascota
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # 2. Validar clínica
        clinic = await self.clinic_repo.get_by_id(clinic_id)
        if not clinic:
            raise ResourceNotFoundException("Clínica")

        # 3. Validar vet pertenece a clínica
        vet = await self.user_repo.get_by_id(veterinarian_id)
        if not vet or vet.veterinary_clinic_id != clinic_id:
            raise ValidationException("Veterinario no pertenece a esta clínica")

        # 4 & 5. Buscar o crear MedicalRecord
        existing_records = await self.record_repo.get_by_pet_id(pet_id)
        
        for record in existing_records:
            if record.veterinary_clinic_id == clinic_id:
                # Ya existe, retornar
                return record

        # Crear nuevo
        medical_record = await self.record_repo.create(
            pet_id=pet_id,
            veterinary_clinic_id=clinic_id,
            veterinarian_id=veterinarian_id,
            tipo="consulta_inicial",
            descripcion="Mascota vinculada a clínica",
            fecha_registro=datetime.utcnow()
        )
        await self.db.commit()

        return medical_record

    async def _get_qr_and_clinic(self, qr_codigo: str) -> Optional[dict]:
        """
        Helper: Obtiene clínica asociada a un QR
        Placeholder para integración con QRRepository
        """
        # TODO: Implementar cuando se integre con QRRepository
        # Por ahora retorna mock
        return {
            "qr_codigo": qr_codigo,
            "clinic_id": uuid.uuid4(),
            "activo": True
        }

    async def validate_no_duplicates(
        self,
        pet_name: str,
        owner_id: uuid.UUID,
        clinic_id: uuid.UUID
    ) -> bool:
        """
        Validación: Verificar que no existe duplicado
        (Misma mascota, mismo dueño, misma clínica)
        """
        owner_pets = await self.pet_repo.get_by_user(owner_id)
        
        for pet in owner_pets:
            # Verificar si ya existe MedicalRecord en esta clínica
            if pet.nombre.lower() == pet_name.lower():
                records = await self.record_repo.get_by_pet_id(pet.id)
                for record in records:
                    if record.veterinary_clinic_id == clinic_id:
                        return False  # Duplicado encontrado
        
        return True  # No es duplicado


# Eventos para Event-Driven Pattern
class PetRegisteredEvent:
    """Evento: Mascota registrada en el sistema"""
    def __init__(self, pet_id: uuid.UUID, owner_id: uuid.UUID, clinic_id: Optional[uuid.UUID] = None):
        self.pet_id = pet_id
        self.owner_id = owner_id
        self.clinic_id = clinic_id
        self.timestamp = datetime.utcnow()


class PetLinkedToClinicEvent:
    """Evento: Mascota vinculada a clínica"""
    def __init__(self, pet_id: uuid.UUID, clinic_id: uuid.UUID):
        self.pet_id = pet_id
        self.clinic_id = clinic_id
        self.timestamp = datetime.utcnow()
