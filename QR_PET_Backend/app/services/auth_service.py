from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import hash_password, verify_password, create_access_token
from app.core.exceptions import (
    AuthenticationException, ConflictException, ResourceNotFoundException, InvalidDataException
)
from app.core.constants import MESSAGE_EMAIL_EXISTS, MESSAGE_INVALID_CREDENTIALS, validate_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, TokenResponse, UserLogin, UserCreate

class AuthService:
    """Service para lógica de autenticación y gestión de identidad"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        
    async def register(self, user_data: UserCreate) -> UserResponse:
        """Registra un nuevo usuario y persiste la transacción"""
        
        # 1. Validar contraseña con nuevos requisitos
        is_valid, password_error = validate_password(user_data.password)
        if not is_valid:
            raise InvalidDataException(password_error)
        
        # 2. Validaciones de existencia (Lógica de Negocio)
        if await self.user_repo.email_exists(user_data.email):
            raise ConflictException(MESSAGE_EMAIL_EXISTS)
        
        # 3. Preparación de datos
        password_hash = hash_password(user_data.password)
        
        # 4. Creación a través del repo (BaseRepository maneja los kwargs)
        user = await self.user_repo.create(
            email=user_data.email,
            nombre=user_data.nombre,
            password_hash=password_hash,
            telefono=user_data.telefono,
            avatar_url=user_data.avatar_url,
            rol="usuario" # Rol por defecto
        )
        
        # 5. EL COMMIT: Aquí es donde la sesión se guarda en la DB
        await self.db.commit()
        await self.db.refresh(user)
        
        return UserResponse.model_validate(user)
    
    async def login(self, login_data: UserLogin) -> TokenResponse:
        """Verifica credenciales y genera JWT"""
        user = await self.user_repo.get_by_email(login_data.email)
        
        # Usamos una sola validación para no dar pistas de si el email existe
        if not user or not verify_password(login_data.password, user.password_hash):
            raise AuthenticationException(MESSAGE_INVALID_CREDENTIALS)
        
        # Generar token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "rol": user.rol}
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
    
    async def get_user(self, user_id: str) -> UserResponse:
        """Obtiene el perfil de un usuario por ID"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundException("Usuario")
        
        return UserResponse.model_validate(user)
