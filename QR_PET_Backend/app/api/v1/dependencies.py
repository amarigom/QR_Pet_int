"""
Dependencias y funciones compartidas para endpoints
"""
from typing import Optional
import uuid
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Core y Base de Datos
from app.core.database import get_db
from app.core.auth import decode_access_token
from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.core.constants import UserRole

# 2. Imports de persistencia (Repositorios y Modelos)
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.repositories.qr_repository import QRRepository 

# 3. Imports de Servicios
from app.services.admin_service import AdminService
from app.services.qr_service import QRService 

# Definimos el esquema de seguridad
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Obtiene el usuario actual validando el token JWT"""
    
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise AuthenticationException("Token inválido: falta el identificador")

    user_repo = UserRepository(db)
    
    try:
        # Convertimos a UUID si es necesario
        user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        user = await user_repo.get_by_id(user_uuid)
    except ValueError:
        raise AuthenticationException("ID de usuario en formato inválido")
    
    if not user:
        raise AuthenticationException("Usuario no encontrado")
    
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Requiere que el usuario sea administrador"""
    if user.rol != UserRole.ADMIN:
        raise PermissionDeniedException("Se requieren permisos de administrador")
    return user

async def get_optional_user(
    # Cambiamos esto para que use el header si existe, pero no sea obligatorio
    token: Optional[str] = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Versión opcional corregida para no obligar el login"""
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except Exception:
        return None
    
from app.services.admin_service import AdminService # Asegurate de importar el servicio

async def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    """Proveedor del servicio de administración"""
    return AdminService(db)


# =====================================================================
# DEPENDENCIAS PARA MÓDULO QR 
# =====================================================================

async def get_qr_repository(db: AsyncSession = Depends(get_db)) -> QRRepository:
    """Proveedor del repositorio de códigos QR, inyectando la sesión de BD"""
    return QRRepository(db)

async def get_qr_service(db: AsyncSession = Depends(get_db)) -> QRService:
    """Proveedor del servicio pasándole la sesión limpia"""
    return QRService(db=db)