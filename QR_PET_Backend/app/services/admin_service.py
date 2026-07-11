from typing import Dict, Any, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

# Repositorios
from app.repositories.user_repository import UserRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.qr_repository import QRRepository
from app.repositories.scan_repository import ScanRepository
from datetime import datetime, timedelta

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
        self.scan_repo = ScanRepository(db)

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
        """Obtiene todas las mascotas incluyendo su QR asociado en singular"""
        pets = await self.pet_repo.get_all_with_owner(limit=limit, offset=(page - 1) * limit)
        total = await self.pet_repo.count()
        
        return {
            "items": [
                {
                    "id": str(p.id),
                    "nombre": p.nombre,
                    "especie": p.especie,
                    "owner_name": p.owner.nombre if p.owner else "Sin dueño",
                    "estado": p.estado,
                    "created_at": p.created_at,
                    # 🎯 Cambiamos el bucle por un mapeo directo en singular de qr_code
                    "qr": {
                        "id": str(p.qr_code.id),
                        "codigo": p.qr_code.codigo,
                        "activo": p.qr_code.activo
                    } if p.qr_code else None
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
        """Detalle completo de mascota para administración adaptado a esquemas compuestos"""
        # 1. Buscamos la mascota en el repositorio
        pet = await self.pet_repo.get_by_id_with_owner(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # 2. Buscamos el QR asociado
        qr = await self.qr_repo.get_by_mascota(pet.id)
        
        # 3. Retornamos el diccionario estructurado exactamente como piden los esquemas
        return {
            # Campos de PetResponse (Padre)
            "id": pet.id,  # Dejamos el UUID nativo, Pydantic se encarga de serializarlo a str
            "nombre": pet.nombre,
            "especie": getattr(pet, 'especie', 'No definida'),
            "raza": getattr(pet, 'raza', None),
            "color": getattr(pet, 'color', None),
            "edad_aproximada": getattr(pet, 'edad_aproximada', None),
            "foto_url": getattr(pet, 'foto_url', None),
            "notas": getattr(pet, 'notas', None),
            "estado": getattr(pet, 'estado', 'activo'),
            "usuario_id": pet.usuario_id,
            "created_at": pet.created_at,
            
            # Campo 'owner' mapeado a la estructura de UserResponse
            # Campo 'owner' mapeado de forma idéntica a UserResponse
        "owner": {
            "id": pet.owner.id,
            "email": pet.owner.email,
            "nombre": pet.owner.nombre,
            "nombre_completo": getattr(pet.owner, 'nombre_completo', pet.owner.nombre),
            
            "rol": getattr(pet.owner, 'rol', 'usuario'),
            "telefono": getattr(pet.owner, 'telefono', None),
            "avatar_url": getattr(pet.owner, 'avatar_url', None),
            "created_at": pet.owner.created_at,
            "activo": getattr(pet.owner, 'activo', True)  # Por si UserResponse exige 'activo'
        } if pet.owner else None,
            
            # Campo 'qr_code' mapeado exactamente como lo requiere composite.py (QRResponse)
            # Campo 'qr_code' mapeado exactamente como lo requiere composite.py (QRResponse)
        "qr_code": {
            "id": qr.id,
            "codigo": qr.codigo,
            
            # 🌟 SOLUCIÓN: Agregamos 'activo' para satisfacer a QRResponse
            # Evaluamos si el estado es 'activo' o si el modelo ya tiene un booleano en qr.activo
            "activo": qr.activo if hasattr(qr, 'activo') else (getattr(qr, 'estado', 'activo') == 'activo'),
            "estado": getattr(qr, 'estado', 'activo'),
            
            "created_at": qr.created_at if hasattr(qr, 'created_at') else pet.created_at
        } if qr else None
        }
    from datetime import datetime, timedelta, date

    async def get_dashboard_stats(self) -> dict:
        total_users = await self.user_repo.count()
        total_pets = await self.pet_repo.count()
        total_qrs = await self.qr_repo.count()
        total_scans = await self.scan_repo.count()

        # 1. 📅 Definimos el rango de los últimos 30 días
        hoy = datetime.utcnow()
        hace_30_dias = hoy - timedelta(days=30)

        # 2. 🔍 Traemos los escaneos recientes desde el repositorio
        # (Asegurate de que tu scan_repo tenga un método similar o adaptalo a tu implementación)
        recent_scans_data = await self.scan_repo.get_scans_since(hace_30_dias)

        # 3. 📊 Agrupamos los escaneos por día para armar el gráfico de Recharts
        # Inicializamos los últimos 30 días con 0 para que el gráfico no tenga huecos
        scans_dict = {(hoy - timedelta(days=i)).date(): 0 for i in range(30)}

        for scan in recent_scans_data:
            # Extraemos la fecha del objeto de escaneo (sea datetime o date)
            fecha_scan = scan.created_at.date() if isinstance(scan.created_at, datetime) else scan.created_at
            if fecha_scan in scans_dict:
                scans_dict[fecha_scan] += 1

        # Formateamos el array ordenado cronológicamente para Recharts
        scans_by_day = [
            {"date": fecha.isoformat(), "count": cantidad}
            for fecha, cantidad in sorted(scans_dict.items())
        ]

        # 🧮 LA FUNCIÓN: Calculamos el promedio diario real de los últimos 30 días
        total_escaneos_30_dias = sum(scans_dict.values())
        daily_average = round(total_escaneos_30_dias / 30, 1)

        return {
            "users_count": total_users,
            "pets_count": total_pets,
            "qrs_count": total_qrs,
            "scans_count": total_scans,  # Histórico total del sistema
            "scans_by_day": scans_by_day, # Array para el gráfico
            "daily_average": daily_average, # 👈 Tu promedio diario calculado en backend
            "timestamp": datetime.utcnow()
        }
        async def get_scans_coordinates(self) -> List[List[float]]:
            """Obtiene solo las coordenadas para el mapa de calor"""
            from sqlalchemy import select
            from app.models.scan import Scan

            # Filtramos solo los que tienen latitud y longitud no nulas
            query = select(Scan.latitud, Scan.longitud).where(
                Scan.latitud.isnot(None), 
                Scan.longitud.isnot(None)
            )
            result = await self.db.execute(query)
            # Retornamos formato [lat, lng] que es el que suelen pedir las librerías de mapas
            # return [[row.latitud, row.longitud] for row in result.all()]
            rows = result.all()
            return [{"lat": float(row.latitud), "lng": float(row.longitud)} for row in rows]    
        
        # En app/services/admin_service.py

    async def get_heatmap_data(self) -> List[Dict[str, float]]:
        """
        Obtiene todas las coordenadas de escaneos para el mapa de calor.
        Filtra los registros que no tienen GPS.
        """
        from sqlalchemy import select
        from app.models.scan import Scan

        # Seleccionamos solo latitud y longitud de los escaneos que tienen ambos
        query = select(Scan.latitud, Scan.longitud).where(
            Scan.latitud.isnot(None),
            Scan.longitud.isnot(None)
        )
        
        result = await self.db.execute(query)
        rows = result.all()

        # Retornamos una lista de dicts (o podrías retornar [lat, lng] según tu librería de mapa)
        #return [{"lat": row.latitud, "lng": row.longitud} for row in rows]
        return [{"lat": float(row.latitud), "lng": float(row.longitud)} for row in rows]
