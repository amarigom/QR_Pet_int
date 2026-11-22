from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import List

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.auth import hash_password
from app.core.exceptions import ResourceNotFoundException
from app.models.pet import Pet
from app.models.qr import QRCode, QRType
from app.models.user import User
from app.repositories.pet_repository import PetRepository
from app.repositories.user_repository import UserRepository
from app.repositories.veterinario_repository import VeterinarioRepository
from app.schemas.veterinario import (
    DiagnosticAltaExpressCreate,
    DiagnosticAltaExpressResponse,
    DiagnosticPetLookupItem,
)
from app.services.qr_service import QRService
from app.services.turno_reminder_service import WhatsAppCloudSender
from app.services.veterinarian_client_service import VeterinarianClientService


class VeterinarianDiagnosticService:
    """
    Orquesta la recepción de estudios clínicos en mostrador/laboratorio:
    - Búsqueda de mascotas existentes (vinculadas o externas) por QR, email o teléfono.
    - Alta Express de dueño + mascota + QR Clínico (CLN-XXXXXX) sin rastreo en mapa.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.vet_repo = VeterinarioRepository(db)
        self.user_repo = UserRepository(db)
        self.pet_repo = PetRepository(db)
        self.qr_service = QRService(db)
        self.client_service = VeterinarianClientService(db)

    async def lookup_pets_for_study(self, query: str) -> List[DiagnosticPetLookupItem]:
        term = query.strip()
        if not term:
            return []

        code_candidate = term.upper()
        like_term = f"%{term}%"

        # 1. Buscar coincidencia exacta por código QR (FISICO o CLINICO)
        qr_stmt = (
            select(QRCode)
            .options(joinedload(QRCode.mascota).joinedload(Pet.owner))
            .where(QRCode.codigo == code_candidate, QRCode.activo.is_(True))
        )
        qr_result = await self.db.execute(qr_stmt)
        matched_qr = qr_result.scalar_one_or_none()

        pets_by_id: dict = {}
        preferred_qr_by_pet: dict = {}

        if matched_qr and matched_qr.mascota:
            pets_by_id[matched_qr.mascota.id] = matched_qr.mascota
            preferred_qr_by_pet[matched_qr.mascota.id] = matched_qr

        # 2. Buscar mascotas por email, teléfono o nombre del dueño / mascota
        pet_stmt = (
            select(Pet)
            .join(User, Pet.usuario_id == User.id)
            .options(joinedload(Pet.owner))
            .where(
                or_(
                    User.email.ilike(like_term),
                    User.telefono.ilike(like_term),
                    User.nombre.ilike(like_term),
                    Pet.nombre.ilike(like_term),
                )
            )
            .limit(15)
        )
        pet_result = await self.db.execute(pet_stmt)
        for pet in pet_result.scalars().unique().all():
            pets_by_id.setdefault(pet.id, pet)

        items: List[DiagnosticPetLookupItem] = []
        for pet_id, pet in pets_by_id.items():
            qr = preferred_qr_by_pet.get(pet_id)
            if qr is None:
                qr = await self.qr_service.qr_repo.get_by_mascota(pet_id)

            owner = pet.owner
            items.append(
                DiagnosticPetLookupItem(
                    pet_id=pet.id,
                    pet_name=pet.nombre,
                    especie=pet.especie,
                    raza=pet.raza,
                    owner_id=pet.usuario_id,
                    owner_name=owner.nombre if owner else "Tutor",
                    owner_email=owner.email if owner else "",
                    owner_telefono=owner.telefono if owner else None,
                    qr_codigo=qr.codigo if qr else None,
                    qr_tipo=qr.tipo if qr else None,
                )
            )

        return items

    async def register_alta_express(
        self,
        data: DiagnosticAltaExpressCreate,
        veterinarian: User,
        sender: WhatsAppCloudSender | None = None,
    ) -> DiagnosticAltaExpressResponse:
        clinic = await self.vet_repo.get_active_profile(veterinarian.id)
        if clinic is None:
            raise ResourceNotFoundException(
                "Perfil veterinario",
                detail="Completá el perfil de tu veterinaria antes de registrar pacientes.",
            )

        email = str(data.owner_email).lower().strip()
        existing_user = await self.user_repo.get_by_email(email)

        is_new_owner = False
        raw_token: str | None = None

        if existing_user is not None:
            owner = existing_user
        else:
            is_new_owner = True
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=48)

            owner = User(
                email=email,
                nombre=data.owner_nombre.strip(),
                telefono=data.owner_telefono.strip(),
                password_hash=hash_password(secrets.token_urlsafe(48)),
                rol="usuario",
                pending_activation=True,
                activation_token_hash=token_hash,
                activation_token_expires_at=expires_at,
                whatsapp_recordatorios_consent=False,
            )
            self.db.add(owner)
            await self.db.flush()
            await self.db.refresh(owner)

        # Crear la mascota asociada al dueño (sin vincularla como paciente fijo en veterinario_mascotas)
        pet = await self.pet_repo.create(
            usuario_id=owner.id,
            nombre=data.pet_nombre.strip(),
            especie=data.pet_especie.strip().lower(),
            raza=data.pet_raza.strip() if data.pet_raza else None,
        )

        # Generar QR Clínico (CLN-XXXXXX, no rastreable en mapa)
        clinical_qr = await self.qr_service.create_clinical_qr_for_pet(
            mascota_id=pet.id,
            commit=False,
        )

        await self.db.commit()
        await self.db.refresh(pet)
        await self.db.refresh(clinical_qr)

        whatsapp_sent = False
        activation_url = None
        whatsapp_error = None
        message = (
            f"Ficha clínica creada con QR {clinical_qr.codigo}. Ya podés subir los estudios."
        )

        if is_new_owner and raw_token is not None:
            activation_result = await self.client_service._send_activation_link(
                client=owner,
                token=raw_token,
                sender=sender,
            )
            whatsapp_sent = activation_result["whatsapp_sent"]
            activation_url = activation_result["activation_url"]
            whatsapp_error = activation_result["whatsapp_error"]
            message = (
                f"Paciente registrado con QR clínico {clinical_qr.codigo}. "
                f"{activation_result['message']}"
            )
        elif not is_new_owner:
            message = (
                f"Mascota agregada a la cuenta existente de {owner.nombre} "
                f"con QR clínico {clinical_qr.codigo}."
            )

        return DiagnosticAltaExpressResponse(
            pet_id=pet.id,
            pet_nombre=pet.nombre,
            pet_especie=pet.especie,
            owner_id=owner.id,
            owner_nombre=owner.nombre,
            owner_email=owner.email,
            is_new_owner=is_new_owner,
            qr_codigo=clinical_qr.codigo,
            qr_tipo=QRType.CLINICO.value,
            whatsapp_sent=whatsapp_sent,
            activation_url=activation_url,
            whatsapp_error=whatsapp_error,
            message=message,
        )