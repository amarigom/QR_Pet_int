import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.exceptions import ResourceNotFoundException
from app.core.mail import send_scan_notification_email
from app.models.pet import Pet
from app.models.qr import QRCode
from app.models.scan import Scan
from app.repositories.qr_repository import QRRepository
from app.repositories.scan_repository import ScanRepository
from app.schemas.scan import (
    ScanCreate,
    ScanLocationUpdate,
    ScanResponse,
    ScanUpdate,
)


class ScanService:
    """Service para gestionar el registro y consulta de escaneos"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.scan_repo = ScanRepository(db)
        self.qr_repo = QRRepository(db)

    async def create_scan(self, scan_data: ScanCreate) -> Dict[str, Any]:
        """Registra un nuevo escaneo a partir del código de un QR."""
        qr = await self.qr_repo.get_by_code(scan_data.codigo)
        if not qr:
            raise ResourceNotFoundException(
                "Código QR", "El código escaneado no existe"
            )

        scan = await self.scan_repo.create(
            qr_id=qr.id, **scan_data.model_dump(exclude={"codigo"})
        )
        await self.db.commit()
        await self.db.refresh(scan)

        return {
            "success": True,
            "message": "Escaneo registrado. El dueño será notificado.",
            "scan": ScanResponse.model_validate(scan),
        }

    async def process_scan_from_qr(self, codigo_qr: str) -> Dict[str, Any]:
        """Punto de entrada para el escaneo inicial.

        Busca mascota y dueño.
        """
        # Consulta con Eager Loading para evitar el error 500 de Lazy Loading en Async
        stmt = (
            select(QRCode)
            .options(joinedload(QRCode.mascota).joinedload(Pet.owner))
            .where(QRCode.codigo == codigo_qr)
        )

        result = await self.db.execute(stmt)
        qr = result.scalar_one_or_none()

        if not qr:
            raise ResourceNotFoundException("Código QR", "QR no encontrado")

        if not qr.mascota:
            raise ResourceNotFoundException(
                "Mascota", "Este QR no tiene una mascota asignada"
            )

        # Crear el registro inicial del escaneo (solo con el ID del QR)
        scan = await self.scan_repo.create(qr_id=qr.id)

        await self.db.commit()
        await self.db.refresh(scan)
        pet_data = qr.mascota
        owner_data = pet_data.owner

        return {
            "scan_id": str(scan.id),
            "pet": {
                "id": str(pet_data.id),
                "nombre": pet_data.nombre,
                "especie": pet_data.especie,
                "raza": pet_data.raza or "",
                "foto_url": pet_data.foto_url or "",
                "notes": pet_data.notas or "",
                "estado": pet_data.estado,
            },
            "owner": {
                "nombre": owner_data.nombre if owner_data else "Dueño",
                "telefono": owner_data.telefono if owner_data else "",
            },
        }

    async def update_scan_data(
        self, scan_id: UUID, data: ScanUpdate
    ) -> Optional[Scan]:
        """Actualiza los datos del escaneo (ubicación, mensaje)."""
        result = await self.db.execute(select(Scan).where(Scan.id == scan_id))
        db_scan = result.scalar_one_or_none()

        if not db_scan:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_scan, key, value)

        await self.db.commit()
        await self.db.refresh(db_scan)

        return db_scan

    async def get_pet_scans(
        self, pet_id: UUID, page: int = 1, limit: int = 20
    ) -> Dict[str, Any]:
        """Obtiene el historial de escaneos de una mascota específica"""
        offset = (page - 1) * limit
        scans = await self.scan_repo.get_by_mascota(pet_id, limit, offset)

        qr = await self.qr_repo.get_by_mascota(pet_id)
        total = await self.scan_repo.count_by_qr(qr.id) if qr else 0

        return {
            "items": [ScanResponse.model_validate(s) for s in scans],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }

    async def get_all_scans(
        self, page: int = 1, limit: int = 100
    ) -> Dict[str, Any]:
        """Listado administrativo global"""
        offset = (page - 1) * limit
        scans = await self.scan_repo.get_all_with_details(limit, offset)
        total = await self.scan_repo.count()

        return {
            "items": [
                {
                    "id": str(s.id),
                    "qr_codigo": s.qr.codigo if s.qr else "N/A",
                    "pet_name": (
                        s.qr.mascota.nombre
                        if s.qr and s.qr.mascota
                        else "Sin asignar"
                    ),
                    "escaneado_en": s.created_at,
                    "direccion_aproximada": s.direccion_aproximada or "",
                    "latitud": s.latitud,
                    "longitud": s.longitud,
                }
                for s in scans
            ],
            "total": total,
            "page": page,
            "limit": limit,
        }

    async def get_admin_heatmap_data(self) -> List[Dict[str, Any]]:
        """Lógica de negocio para el mapa de calor"""
        scans = await self.scan_repo.get_all_scans_with_coords()

        return [
            {
                "id": str(s.id),
                "latitud": s.latitud,
                "longitud": s.longitud,
                "mascota_nombre": (
                    s.qr.mascota.nombre if s.qr and s.qr.mascota else "Mascota"
                ),
                "fecha": s.created_at.isoformat(),
            }
            for s in scans
        ]

    async def update_scan_location(
        self, scan_id: UUID, location_data: ScanLocationUpdate
    ) -> Dict[str, Any]:
        """Actualiza un escaneo existente con las coordenadas GPS precisas del

        transeúnte y retorna los datos necesarios para armar el WhatsApp en el
        Frontend.
        """
        # CAMBIO: Agregamos joinedload para traer el QR, la Mascota y el Dueño de un solo tiro de forma asíncrona
        stmt = (
            select(Scan)
            .options(joinedload(Scan.qr).joinedload(QRCode.mascota).joinedload(Pet.owner))
            .where(Scan.id == scan_id)
        )
        result = await self.db.execute(stmt)
        scan_record = result.scalar_one_or_none()

        if not scan_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registro de escaneo no encontrado",
            )

        scan_record.latitud = location_data.latitud
        scan_record.longitud = location_data.longitud

        await self.db.commit()
        await self.db.refresh(scan_record)

        # CAMBIO: Navegación correcta a través del árbol de relaciones (Scan -> QR -> Mascota -> Owner)
        qr = scan_record.qr
        pet = qr.mascota if qr else None
        owner = pet.owner if pet else None

        if not owner or not getattr(owner, "telefono", None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La mascota escaneada no tiene un teléfono de dueño asociado",
            )

        google_maps_url = f"https://www.google.com/maps?q={location_data.latitud},{location_data.longitud}"

        return {
            "scan_id": str(scan_record.id),
            "status": "location_updated",
            "telefono_dueno": owner.telefono,
            "pet_name": pet.nombre,
            "google_maps_url": google_maps_url,
        }

    async def register_initial_scan(
        self, qr_codigo: str, ip_transeunte: str
    ) -> Dict[str, Any]:
        """Paso 1: Procesa el escaneo, guarda en BD y despacha la alerta de mail

        vía Brevo.
        """
        # CAMBIO: En lugar de pedir pet_id por parámetro (que el QR físico no sabe cuál es),
        # usamos el qr_codigo que lee la cámara y llamamos internamente a nuestra lógica estructurada.
        scan_info = await self.process_scan_from_qr(codigo_qr=qr_codigo)

        ubicacion_estimada = "Tandil, Buenos Aires"

        try:
            await send_scan_notification_email(
                to_email=scan_info["owner"]["email"] if "email" in scan_info["owner"] else "tu_correo_test@gmail.com",  # Ajustá esto según tu modelo User
                owner_name=scan_info["owner"]["nombre"],
                pet_name=scan_info["pet"]["nombre"],
                ubicacion_ip=ubicacion_estimada,
            )
        except Exception as e:
            print(f"Error enviando correo por Brevo: {e}")

        return {
            "scan_id": scan_info["scan_id"],
            "status": "success",
            "message": "Escaneo registrado y alerta enviada de forma asincrónica.",
        }