from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession # Cambiado para Neon/Async
from typing import List

# 1. IMPORTACIONES DIRECTAS (Esto elimina los errores de "not defined")
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user # Ajustado a tu dependencies.py
from app.models.scan import Scan
from app.models.qr import QRCode
from app.models.pet import Pet
from app.schemas.scan import ScanLocation # Importamos la clase directamente

router = APIRouter()

@router.get("/locations", response_model=List[ScanLocation]) # Usamos ScanLocation directo
async def get_user_scans_locations(
    db: AsyncSession = Depends(get_db), # Usamos AsyncSession
    current_user: Pet = Depends(get_current_user) # Ajustado a tu dependencia
):
    """
    Obtiene coordenadas siguiendo el camino: Escaneo -> QR -> Mascota
    """
    # 2. Usamos SELECT (Estilo SQLAlchemy 2.0 / Async) en lugar de db.query
    query = (
        select(
            Scan.id,
            Scan.latitud,
            Scan.longitud,
            Pet.nombre.label("mascota_nombre"),
            Scan.created_at.label("fecha")
        )
        .join(QRCode, Scan.qr_id == QRCode.id)
        .join(Pet, QRCode.mascota_id == Pet.id) 
        .filter(Pet.usuario_id == current_user.id) 
        .filter(Scan.latitud.isnot(None))
    )
    
    # 3. Ejecución asíncrona corregida
    result = await db.execute(query)
    
    # Convertimos a mapeo para que Pydantic lo entienda
    return result.mappings().all()
