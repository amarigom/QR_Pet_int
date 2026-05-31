import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query, status,HTTPException
from fastapi.responses import StreamingResponse

# 2. El import correcto y específico para la respuesta de streaming
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Esquemas
from app.schemas.common import SuccessResponse
from app.schemas.user import UserResponse, DashboardStats
from app.schemas.composite import PetDetailResponse
from app.models.user import User

# 2. Core y Seguridad (Importamos las dependencias necesarias)
from app.core.database import get_db
from ..dependencies import get_admin_service, require_admin, get_qr_service
from app.services.admin_service import AdminService
from app.services.qr_service import QRService 

from app.core.database import get_db  # <--- Solucionado acá!
from app.utils.qr_generator import generar_qr_memoria 
from app.repositories.qr_repository import QRRepository


router = APIRouter(prefix="/admin", tags=["Administración"])

@router.post("/qr/generate", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def generate_qrs(
    cantidad: int = Query(1, ge=1, le=100),
    lote: str = Query(..., min_length=3, description="Identificador del lote (ej: LOTE-01)"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Genera nuevos códigos QR sin mascota asociada en lote."""
    service = QRService(db)
    return await service.generate_qrs(cantidad,lote=lote, admin_user=admin)

@router.get("/users", response_model=Dict[str, Any])
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_all_users(page, limit)

@router.delete("/users/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: uuid.UUID,
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    # Nota: Asegúrate de que admin sea el objeto usuario o un dict con 'id'
    admin_id = admin.id if hasattr(admin, 'id') else admin["id"]
    await service.delete_user(admin_id, user_id)
    return SuccessResponse(message="Usuario eliminado correctamente")

@router.post("/users/{user_id}/toggle-admin", response_model=UserResponse)
async def toggle_admin_role(
    user_id: uuid.UUID, 
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    admin_id = admin.id if hasattr(admin, 'id') else admin["id"]
    return await service.toggle_admin_role(admin_id, user_id)

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_dashboard_stats()

@router.get("/pets", response_model=Dict[str, Any])
async def get_all_pets(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    return await service.get_all_pets(page, limit)

@router.get("/scans/heatmap", response_model=List[Dict[str, float]])
async def get_admin_heatmap(
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    """
    Endpoint para obtener coordenadas del mapa de calor.
    Solo accesible para administradores.
    """
    return await service.get_heatmap_data()

@router.get("/pets/{pet_id}", response_model=PetDetailResponse)
async def admin_get_pet_detail(
    pet_id: uuid.UUID,
    admin: Any = Depends(require_admin),
    service: AdminService = Depends(get_admin_service)
):
    """Inspección profunda usando la vista compuesta"""
    return await service.get_pet_detail_admin(pet_id)

@router.patch("/qrs/{codigo}/status")
async def admin_toggle_qr(
    codigo: str, 
    qr_service: QRService = Depends(get_qr_service),
    current_admin: User = Depends(require_admin)
):
    """
    Endpoint de administración para inhabilitar o habilitar un QR por su código visible.
    """
    resultado = await qr_service.activar_desactivar_qr(codigo)
    return resultado

@router.get("/admin/qr/{id_mascota}", summary="Previsualización de QR para el Administrador")
async def obtener_qr_administrador(id_mascota: str, db: AsyncSession = Depends(get_db)):
    """
    Devuelve la imagen PNG del QR en tiempo real desde la memoria RAM.
    Patrón Repositorio Asíncrono respetado al 100%.
    """
    id_limpio = id_mascota.strip()
    if not id_limpio:
        raise HTTPException(status_code=400, detail="El ID de la mascota no puede estar vacío.")
    
    # Instanciamos tu repositorio pasándole la sesión asíncrona real
    repo = QRRepository(session=db)
    
    # Buscamos asincrónicamente usando tu método get_by_code
    qr_existente = await repo.get_by_code(codigo=id_limpio)
    
    if not qr_existente:
        raise HTTPException(
            status_code=404, 
            detail=f"El código QR '{id_limpio.upper()}' no existe en el sistema."
        )

    try:
        # Generación síncrona en la RAM (No usa await porque es pura memoria)
        buffer_imagen = generar_qr_memoria(id_limpio)
        
        # Enviamos el flujo de bytes directo a la pantalla
        return StreamingResponse(buffer_imagen, media_type="image/png")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al renderizar el QR: {str(e)}")