import uuid
from typing import Any

from sqlalchemy import select, union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.constants import UserRole
from app.models.historia_clinica import HistoriaClinica
from app.models.pet import Pet
from app.models.qr import QRCode
from app.models.scan import Scan
from app.models.turno import Turno
from app.models.user import User
from app.models.veterinario import PerfilVeterinario
from app.models.veterinario_cliente import veterinario_clientes


class VeterinarianDashboardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _linked_pet_ids(self, veterinarian_id: uuid.UUID):
        return union(
            select(Turno.mascota_id).where(Turno.veterinario_id == veterinarian_id),
            select(HistoriaClinica.mascota_id).where(
                HistoriaClinica.veterinario_id == veterinarian_id
            ),
        ).subquery()

    async def get_dashboard_data(self, veterinarian_id: uuid.UUID) -> dict[str, Any]:
        clinic_result = await self.db.execute(
            select(PerfilVeterinario).where(PerfilVeterinario.user_id == veterinarian_id)
        )
        clinic = clinic_result.scalar_one_or_none()
        linked_pet_ids = self._linked_pet_ids(veterinarian_id)
        linked_pet_id_query = select(linked_pet_ids.c.mascota_id)

        linked_pets_result = await self.db.execute(
            select(Pet)
            .where(Pet.id.in_(linked_pet_id_query))
            .options(joinedload(Pet.owner), joinedload(Pet.qr_code))
            .order_by(Pet.nombre.asc())
        )
        linked_pets = list(linked_pets_result.scalars().unique().all())

        registered_clients_result = await self.db.execute(
            select(User)
            .join(veterinario_clientes, veterinario_clientes.c.cliente_id == User.id)
            .where(
                veterinario_clientes.c.veterinario_id == veterinarian_id,
                User.rol == UserRole.USER,
            )
            .order_by(User.nombre.asc())
        )
        registered_clients = list(registered_clients_result.scalars().unique().all())

        available_clients_result = await self.db.execute(
            select(User)
            .where(User.rol == UserRole.USER, User.pets.any())
            .options(selectinload(User.pets).joinedload(Pet.qr_code))
            .order_by(User.nombre.asc())
        )
        available_clients = list(available_clients_result.scalars().unique().all())

        linked_clients_by_id: dict[uuid.UUID, User] = {
            client.id: client for client in registered_clients
        }
        for pet in linked_pets:
            if pet.owner:
                linked_clients_by_id[pet.owner.id] = pet.owner

        client_data = {
            "clinic": (
                {
                    "nombre_clinica": clinic.nombre_clinica,
                    "logo_url": clinic.logo_url,
                }
                if clinic
                else None
            ),
            "clients": self._serialize_clients(
                linked_clients_by_id.values(),
                {user_id: sum(pet.usuario_id == user_id for pet in linked_pets)
                 for user_id in linked_clients_by_id},
            ),
            "available_clients": self._serialize_clients(available_clients),
            "pets": [
                {
                    "id": pet.id,
                    "usuario_id": pet.usuario_id,
                    "nombre": pet.nombre,
                    "especie": pet.especie,
                    "estado": pet.estado,
                    "qr": pet.qr_code,
                }
                for pet in linked_pets
            ],
            "available_pets": [
                {
                    "id": pet.id,
                    "usuario_id": pet.usuario_id,
                    "nombre": pet.nombre,
                    "especie": pet.especie,
                    "estado": pet.estado,
                    "qr": pet.qr_code,
                }
                for client in available_clients
                for pet in client.pets
            ],
            "qrs": [
                {
                    "id": pet.qr_code.id,
                    "codigo": pet.qr_code.codigo,
                    "activo": pet.qr_code.activo,
                    "mascota_id": pet.id,
                    "mascota_nombre": pet.nombre,
                    "dueno_nombre": pet.owner.nombre if pet.owner else "Sin dueño",
                }
                for pet in linked_pets
                if pet.qr_code is not None
            ],
        }

        scan_result = await self.db.execute(
            select(Scan, QRCode, Pet)
            .join(QRCode, Scan.qr_id == QRCode.id)
            .join(Pet, QRCode.mascota_id == Pet.id)
            .where(Pet.id.in_(linked_pet_id_query))
            .order_by(Scan.created_at.desc())
            .limit(100)
        )
        client_data["scans"] = [
            {
                "id": str(scan.id),
                "qr_codigo": qr.codigo,
                "pet_name": pet.nombre,
                "created_at": scan.created_at,
                "latitud": scan.latitud,
                "longitud": scan.longitud,
                "direccion_aproximada": scan.direccion_aproximada,
            }
            for scan, qr, pet in scan_result.all()
        ]

        medical_records_result = await self.db.execute(
            select(HistoriaClinica)
            .where(HistoriaClinica.veterinario_id == veterinarian_id)
            .order_by(HistoriaClinica.fecha_consulta.desc())
            .limit(100)
        )
        client_data["medical_records"] = list(medical_records_result.scalars().all())

        appointments_result = await self.db.execute(
            select(Turno)
            .where(Turno.veterinario_id == veterinarian_id)
            .order_by(Turno.fecha_hora_inicio.desc())
            .limit(100)
        )
        client_data["appointments"] = list(appointments_result.scalars().all())
        return client_data

    @staticmethod
    def _serialize_clients(
        users: Any, pet_counts: dict[uuid.UUID, int] | None = None
    ) -> list[dict[str, Any]]:
        return [
            {
                "id": user.id,
                "nombre": user.nombre,
                "email": user.email,
                "telefono": user.telefono,
                "pending_activation": user.pending_activation,
                "mascotas_count": (
                    pet_counts[user.id]
                    if pet_counts is not None
                    else len(user.pets)
                ),
            }
            for user in users
        ]
