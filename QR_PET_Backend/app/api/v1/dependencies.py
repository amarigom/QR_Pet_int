"""
Dependencias y funciones compartidas para endpoints
"""
from typing import Optional
import uuid
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Core y Base de Datos
from app.core.database import get_db
from app.core.auth import decode_access_token
from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.core.constants import UserRole
from app.core.ai_client import embedding_client

# 2. Imports de persistencia (Repositorios y Modelos)
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.repositories.qr_repository import QRRepository
from app.repositories.pet_repository import PetRepository
from app.repositories.pet_vector_repository import PetVectorRepository
from app.repositories.knowledge_repository import KnowledgeRepository 

# 3. Imports de Servicios
from app.services.admin_service import AdminService
from app.services.qr_service import QRService 
from app.services.pet_service import PetService
from app.services.pgvector_service import VectorStoreService

# Definimos el esquema de seguridad
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")



# =====================================================================
# DEPENDENCIAS DE AUTENTICACIÓN Y USUARIOS
# =====================================================================

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Obtiene el usuario actual validando el token JWT."""
    if not token:
        raise AuthenticationException("No se proporcionó token de autenticación")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise AuthenticationException("Token inválido: falta el identificador")

    user_repo = UserRepository(db)
    
    try:
        user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    except ValueError:
        raise AuthenticationException("ID de usuario en formato inválido")
        
    user = await user_repo.get_by_id(user_uuid)
    
    if not user:
        raise AuthenticationException("Usuario no encontrado")
    
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Requiere que el usuario sea administrador."""
    if user.rol != UserRole.ADMIN:
        raise PermissionDeniedException("Se requieren permisos de administrador")
    return user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Obtiene el usuario si hay token válido, o None si falla/no existe."""
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
        user_repo = UserRepository(db)
        return await user_repo.get_by_id(user_uuid)
    except Exception:
        return None


async def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    """Proveedor del servicio de administración."""
    return AdminService(db)


# =====================================================================
# DEPENDENCIAS PARA MÓDULO QR 
# =====================================================================

async def get_qr_repository(db: AsyncSession = Depends(get_db)) -> QRRepository:
    """Proveedor del repositorio de códigos QR."""
    return QRRepository(db)


async def get_qr_service(db: AsyncSession = Depends(get_db)) -> QRService:
    """Proveedor del servicio de códigos QR."""
    return QRService(db=db)


# =====================================================================
# DEPENDENCIAS PARA MÓDULO MASCOTAS Y BÚSQUEDA VECTORIAL (PGVECTOR)
# =====================================================================

async def get_pet_repository(db: AsyncSession = Depends(get_db)) -> PetRepository:
    """Provee una instancia de PetRepository inyectando la sesión de DB."""
    return PetRepository(db)


async def get_pet_vector_repository(db: AsyncSession = Depends(get_db)) -> PetVectorRepository:
    """Proveedor del repositorio vectorial respaldado por PostgreSQL (pgvector)."""
    return PetVectorRepository(db)



async def get_vector_store_service(
    db: AsyncSession = Depends(get_db)
) -> VectorStoreService:
    """Proveedor del servicio vectorial de mascotas con pgvector y embeddings."""
    repository = PetVectorRepository(db)
    knowledge_repo = KnowledgeRepository(db)
    return VectorStoreService(  
        repository=repository,
        knowledge_repo=knowledge_repo,
        ai_client=embedding_client  
    )



async def get_pet_service(
    db: AsyncSession = Depends(get_db),
    vector_service: VectorStoreService = Depends(get_vector_store_service) #  Inyectamos el servicio
) -> PetService:
    pet_repo = PetRepository(db)
    
    # Pasamos vector_service en lugar de vector_repo
    return PetService(db=db,pet_repo=pet_repo, vector_service=vector_service)