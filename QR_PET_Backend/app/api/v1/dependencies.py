"""
Dependencias y funciones compartidas para endpoints
"""
from typing import Optional
import uuid
from fastapi import Depends, Header, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth import decode_access_token
from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.repositories.user_repository import UserRepository
from app.core.constants import UserRole
from app.models.user import User

# Definimos el esquema de seguridad
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Obtiene el usuario actual validando el token JWT"""
    
    # 1. Decodificamos el token para obtener el payload
    payload = decode_access_token(token)
    
    # 2. Extraemos el ID del usuario
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException("Token inválido: falta el identificador")

    # 3. Instanciamos el repositorio con la sesión de DB
    user_repo = UserRepository(db)
    
    try:
        # Convertimos el string a UUID para la consulta
        user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        user = await user_repo.get_by_id(user_uuid)
    except ValueError:
        raise AuthenticationException("ID de usuario en formato inválido")
    
    # 4. Verificamos si el usuario existe
    if not user:
        raise AuthenticationException("Usuario no encontrado")
    
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Requiere que el usuario sea administrador"""
    # Usamos user.rol porque get_current_user devuelve un objeto User
    if user.rol != UserRole.ADMIN:
        raise PermissionDeniedException("Se requieren permisos de administrador")
    return user

async def get_optional_user(
    token: Optional[str] = None, 
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Versión opcional corregida para no obligar el login"""
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except Exception:
        return None