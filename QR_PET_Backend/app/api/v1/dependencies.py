"""
Dependencias y funciones compartidas para endpoints
"""
from pathlib import Path
from typing import Optional
import uuid
import chromadb
from fastapi import Depends, HTTPException, status
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
from app.repositories.pet_repository import PetRepository
from app.repositories.pet_vector_repository import PetVectorRepository

# 3. Imports de Servicios
from app.services.admin_service import AdminService
from app.services.qr_service import QRService 
from app.services.pet_service import PetService
from app.services.chroma_service import VectorStoreService


# Esquema de seguridad OAuth2 (auto_error=False para soportar endpoints opcionales)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# =====================================================================
# CONFIGURACIÓN DE RUTAS ABSOLUTAS
# =====================================================================

# Sube 4 niveles desde app/api/v1/dependencies.py para llegar a QR_PET_Backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
CHROMA_PATH = BASE_DIR / "chroma_db"


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
    """
    Obtiene el usuario si hay token válido. 
    Si el token no está presente o falla la decodificación, retorna None 
    sin corromper la transacción de la DB.
    """
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
        # Silencia errores de token expirado o corrupto para consultas públicas
        return None


async def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    """Proveedor del servicio de administración."""
    return AdminService(db)


# =====================================================================
# DEPENDENCIAS PARA MÓDULO QR 
# =====================================================================

async def get_qr_repository(db: AsyncSession = Depends(get_db)) -> QRRepository:
    """Proveedor del repositorio de códigos QR, inyectando la sesión de BD."""
    return QRRepository(db)


async def get_qr_service(db: AsyncSession = Depends(get_db)) -> QRService:
    """Proveedor del servicio de códigos QR."""
    return QRService(db=db)


# =====================================================================
# DEPENDENCIAS PARA MÓDULO MASCOTAS Y BÚSQUEDA VECTORIAL
# =====================================================================

# Variables globales para el patrón Singleton
_vector_repo_instance: Optional[PetVectorRepository] = None
_vector_store_instance: Optional[VectorStoreService] = None


def get_vector_store_service() -> VectorStoreService:
    """
    Instancia perezosa (singleton) de VectorStoreService para evitar
    re-conectar a ChromaDB en cada petición.
    """
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStoreService()
    return _vector_store_instance


def get_pet_vector_repository() -> PetVectorRepository:
    """
    Proveedor del repositorio vectorial.
    Utiliza instanciación perezosa (lazy) para evitar reabrir la BD en cada request.
    Garantiza el uso de la ruta absoluta CHROMA_PATH (QR_PET_Backend/chroma_db).
    """
    global _vector_repo_instance
    if _vector_repo_instance is None:
        # 1. Crear/conectar el cliente de ChromaDB con ruta absoluta fija
        chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        
        # 2. Obtener o crear la colección de vectores
        collection = chroma_client.get_or_create_collection(name="pets_vectors_v2")
        
        # 3. Inyectar la colección en el repositorio
        _vector_repo_instance = PetVectorRepository(collection)
        
    return _vector_repo_instance


async def get_pet_service(
    db: AsyncSession = Depends(get_db),
    vector_repo: PetVectorRepository = Depends(get_pet_vector_repository)
) -> PetService:
    """Proveedor del servicio de mascotas con inyección de SQL y ChromaDB."""
    return PetService(db=db, vector_repo=vector_repo)

async def get_pet_repository(db: AsyncSession = Depends(get_db)) -> PetRepository:
    """Provee una instancia de PetRepository inyectando la sesión de DB."""
    return PetRepository(db)