import uuid
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import FastAPI, Depends, HTTPException, status
from app.repositories.qr_repository import QRRepository
from app.repositories.pet_repository import PetRepository
from app.core.auth import generate_qr_code
from app.core.exceptions import ResourceNotFoundException, InvalidDataException
from app.core.constants import MESSAGE_QR_NOT_FOUND, MESSAGE_QR_ALREADY_LINKED
from app.schemas.qr import QRResponse, QRActivateData
from app.schemas.composite import QRDetailResponse

# Importamos la herramienta de renderizado físico de imágenes QR
from app.utils.qr_generator import generar_qr_medalla

class QRService:
    """Service para gestionar el ciclo de vida de los códigos QR"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.qr_repo = QRRepository(db)
        self.pet_repo = PetRepository(db)
    
    async def generate_qrs(self, cantidad: int, admin_user: dict) -> Dict[str, Any]:
        """Genera múltiples QRs en lote (Batch operation) y exporta sus PNGs físicos"""
        created_qrs = []
        
        for _ in range(cantidad):
            codigo = generate_qr_code()
            # create() ya no hace commit, solo add()
            qr = await self.qr_repo.create(codigo=codigo, activo=True)
            created_qrs.append(qr)
        
        # Guardamos todos los QRs de un solo golpe en la Base de Datos
        await self.db.commit()
        
        # Una vez impactada la DB con éxito, fabricamos los archivos de imagen correspondientes
        for q in created_qrs:
            try:
                # Le pasamos el código alfanumérico único para que genere la URL/Ficha correcta
                generar_qr_medalla(id_mascota=q.codigo)
            except Exception as e:
                # Logeamos si falla la escritura en disco (ej. falta de permisos en Vercel/VPS),
                # pero no bloqueamos la respuesta HTTP del lote completo
                print(f"Error al escribir imagen física para el código QR {q.codigo}: {e}")
        
        return {
            "created": len(created_qrs),
            "qrs": [QRResponse.model_validate(q) for q in created_qrs],
        }
    
    async def get_qr(self, qr_id: uuid.UUID) -> QRDetailResponse:
        """Obtiene detalles de un QR usando el objeto modelo"""
        qr = await self.qr_repo.get_by_id(qr_id)
        if not qr:
            raise ResourceNotFoundException("Código QR")
        
        return QRDetailResponse.model_validate(qr)
    
    async def get_all_qrs(self, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Listado administrativo de QRs con información de mascota y dueño"""
        offset = (page - 1) * limit
        qrs = await self.qr_repo.get_all_with_details(limit, offset)
        total = await self.qr_repo.count()
        
        return {
            "items": [QRDetailResponse.model_validate(q) for q in qrs],
            "total": total,
            "page": page,
            "limit": limit,
        }
    
    async def check_qr_availability(self, codigo: str) -> Dict[str, Any]:
        """Verifica disponibilidad sin lanzar excepciones (para el frontend)"""
        qr = await self.qr_repo.get_by_code(codigo)
        
        if not qr:
            return {"available": False, "message": "Código no encontrado"}
        
        if qr.mascota_id:
            return {
                "available": False, 
                "message": "Ya está vinculado a una mascota",
                "has_pet": True
            }
        
        return {"available": True, "message": "Disponible para activar"}
    
    async def activate_qr(self, user_id: uuid.UUID, activate_data: QRActivateData) -> Dict[str, Any]:
        """
        Operación Atómica: Crea mascota + Vincula QR.
        Si algo falla, no se guarda nada.
        """
        # 1. Validar el código QR
        qr = await self.qr_repo.get_by_code(activate_data.codigo)
        if not qr:
            raise ResourceNotFoundException("Código QR", MESSAGE_QR_NOT_FOUND)
        
        if qr.mascota_id:
            raise InvalidDataException(MESSAGE_QR_ALREADY_LINKED)
        
        # 2. Crear mascota (Usamos model_dump para mapear el schema al modelo)
        pet = await self.pet_repo.create(
            usuario_id=user_id,
            **activate_data.model_dump(exclude={"codigo"})
        )
        
        # 3. Vincular (Aquí simplemente actualizamos el objeto en la sesión)
        qr.mascota_id = pet.id
        
        # 4. COMMIT ÚNICO: Aquí se guarda la mascota y la actualización del QR
        await self.db.commit()
        await self.db.refresh(pet)
        
        return {
            "message": "QR activado correctamente",
            "pet_id": str(pet.id),
            "qr_id": str(qr.id),
        }
    
    async def delete_qr(self, qr_id: uuid.UUID) -> bool:
        """Elimina un QR y confirma la transacción"""
        success = await self.qr_repo.delete(qr_id)
        if not success:
            raise ResourceNotFoundException("Código QR")
        
        await self.db.commit()
        return True    
    
    async def activar_desactivar_qr(self, codigo: str):
        # 1. El Servicio solicita al repositorio que busque el QR
        qr = await self.qr_repo.get_by_code(codigo)
        
        if not qr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró la placa con código {codigo.upper()}"
            )
                
        
        nuevo_estado = not qr.activo
        
        # 3. El Servicio le solicita formalmente al repositorio que guarde el nuevo estado
        resultado = await self.qr_repo.update_status(db_qr=qr, activo=nuevo_estado)
        
        # 4. Confirmamos la transacción en la sesión asíncrona
        await self.db.commit()
        
        return resultado