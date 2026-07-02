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
)

from app.services.geocoding import obtener_direccion_reversa 


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
        
        # 🎯 NUEVO: Si el impacto ya trae coordenadas, calculamos la ubicación antes de commitear
        if scan.latitud and scan.longitud:
            scan.direccion_aproximada = await obtener_direccion_reversa(scan.latitud, scan.longitud)
        else:
            scan.direccion_aproximada = "Ubicación aproximada"

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

        # 🎯 NUEVO: Inicializamos con un mensaje de espera para el GPS preciso en el frontend
        scan.direccion_aproximada = "Esperando coordenadas GPS..."

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
        self, scan_id: UUID, data: ScanResponse
    ) -> Optional[Scan]:
        """Actualiza los datos del escaneo (ubicación, mensaje)."""
        result = await self.db.execute(select(Scan).where(Scan.id == scan_id))
        db_scan = result.scalar_one_or_none()

        if not db_scan:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_scan, key, value)

        # Asegura la asignación explícita de los campos del formulario
        if getattr(data, "mensaje_encontrador", None):
            db_scan.mensaje_encontrador = data.mensaje_encontrador
        if getattr(data, "telefono_encontrador", None):
            db_scan.telefono_encontrador = data.telefono_encontrador

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
        """Listado administrativo global. Vuele leyendo directo de Neon sin APIs externas."""
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

    async def update_scan_location(self, scan_id: uuid.UUID, location_data: Any) -> Dict[str, Any]:
        """Procesa las actualizaciones selectivas de ubicación y datos del formulario."""
        fields_sent = location_data.model_dump(exclude_unset=True) if hasattr(location_data, "model_dump") else dict(location_data)
        
        # 1. El repositorio modifica el objeto en memoria
        scan_record = await self.scan_repo.update_location_with_relations(
            scan_id=scan_id,
            latitud=fields_sent.get("latitud"),
            longitud=fields_sent.get("longitud"),
            mensaje_encontrador=fields_sent.get("mensaje_encontrador"),
            telefono_encontrador=fields_sent.get("telefono_encontrador")
        )

        if not scan_record:
            raise HTTPException(status_code=404, detail="Registro no encontrado")

        # 2. NUEVO: Si llegaron coordenadas precisas por GPS, actualizamos la dirección física en Neon
        if fields_sent.get("latitud") and fields_sent.get("longitud"):
            direccion_real = await obtener_direccion_reversa(
                fields_sent.get("latitud"), fields_sent.get("longitud")
            )
            scan_record.direccion_aproximada = direccion_real

        await self.db.commit()
        await self.db.refresh(scan_record)

        owner = scan_record.qr.mascota.owner if scan_record.qr and scan_record.qr.mascota else None
        pet = scan_record.qr.mascota if scan_record.qr else None

        # 3. Evaluación para el disparo de la notificación por correo
        tiene_mensaje = fields_sent.get("mensaje_encontrador") or scan_record.mensaje_encontrador
        tiene_telefono = fields_sent.get("telefono_encontrador") or scan_record.telefono_encontrador

        if tiene_mensaje or tiene_telefono:
            if owner and getattr(owner, "email", None):
                try:
                    lat_db = scan_record.latitud
                    lng_db = scan_record.longitud
                    coordenadas_str = f"{lat_db}, {lng_db}" if lat_db else "No proporcionada"

                    await send_scan_notification_email(
                        to_email="andreamarigomez@gmail.com",
                        owner_name=owner.nombre,
                        pet_name=pet.nombre if pet else "Mascota",
                        ubicacion_ip=coordenadas_str, 
                        mensaje=scan_record.mensaje_encontrador or "No proporcionado",        
                        telefono=scan_record.telefono_encontrador or "No proporcionado"     
                    )
                    print("✅ [CORREO] Notificación enviada exitosamente con datos guardados.")
                except Exception as mail_err:
                    print(f"❌ [CORREO] Error en el envío: {mail_err}")
        else:
            print("ℹ️ [TIRO UBICACIÓN] Coordenadas almacenadas. Esperando datos del formulario.")

        google_maps_url = f"https://www.google.com/maps?q={scan_record.latitud},{scan_record.longitud}" if scan_record.latitud else None

        return {
            "scan_id": str(scan_record.id),
            "status": "updated",
            "telefono_dueno": owner.telefono if owner else None,
            "pet_name": pet.nombre if pet else "Mascota",
            "google_maps_url": google_maps_url,
        }
        
        
    
    async def get_user_latest_scans(self, user_id, limit: int = 100, offset: int = 0):
        return await self.scan_repository.get_latest_scans_by_user(
            user_id=user_id, 
            limit=limit, 
            offset=offset
        )