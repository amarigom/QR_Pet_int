from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession


from app.core.auth import hash_password, verify_password, create_access_token
from app.core.exceptions import (
    AuthenticationException, ConflictException, ResourceNotFoundException
)
from app.core.constants import MESSAGE_EMAIL_EXISTS, MESSAGE_INVALID_CREDENTIALS
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, TokenResponse, UserLogin, UserCreate, UserUpdate

from app.repositories.veterinario_repository import VeterinarioRepository
from app.schemas.veterinario import RegistroVeterinarioCreate, AuthVeterinarioRegisterResponse, PerfilVeterinarioResponse
class AuthService:
    """Service para lógica de autenticación y gestión de identidad"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        
    async def register(self, user_data: UserCreate) -> UserResponse:
        """Registra un nuevo usuario y persiste la transacción"""
        
        # 1. Validaciones de existencia (Lógica de Negocio)
        if await self.user_repo.email_exists(user_data.email):
            raise ConflictException(MESSAGE_EMAIL_EXISTS)
        
        # 2. Preparación de datos
        password_hash = hash_password(user_data.password)
        
        # 3. Creación a través del repo (BaseRepository maneja los kwargs)
        user = await self.user_repo.create(
            email=user_data.email,
            nombre=user_data.nombre,
            password_hash=password_hash,
            telefono=user_data.telefono,
            avatar_url=user_data.avatar_url,
            rol="usuario" # Rol por defecto
        )
        
        # 4. EL COMMIT: Aquí es donde la sesión se guarda en la DB
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
    from uuid import UUID
    async def update_user_profile(self, user_id: UUID, user_data: UserUpdate) -> UserResponse:
            """Modifica selectivamente el perfil del usuario y guarda los cambios."""
            # Extraemos solo los campos que el usuario mandó en la petición
            fields_sent = user_data.model_dump(exclude_unset=True)

            # Modificamos el registro en memoria desde el repositorio
            user = await self.user_repo.update_user(
                user_id=user_id,
                telefono=fields_sent.get("telefono"),
                nombre=fields_sent.get("nombre"),
                avatar_url=fields_sent.get("avatar_url")
            )

            if not user:
                raise ResourceNotFoundException("Usuario")

            # El servicio controla la transacción e impacta en la DB
            await self.db.commit()
            await self.db.refresh(user)

            return UserResponse.model_validate(user)
        
    async def register_veterinario(self, vet_data: RegistroVeterinarioCreate) -> AuthVeterinarioRegisterResponse:
            """Registra un nuevo usuario con rol de veterinario y crea su perfil profesional."""
            vet_repo = VeterinarioRepository(self.db)

            # 1. Validaciones
            if await self.user_repo.email_exists(vet_data.email):
                raise ConflictException(MESSAGE_EMAIL_EXISTS)
                
            if await vet_repo.matricula_exists(vet_data.perfil.matricula):
                raise ConflictException("La matrícula informada ya se encuentra registrada.")

            # 2. Hash de contraseña y creación de Usuario con rol 'veterinario'
            password_hash = hash_password(vet_data.password)
            user = await self.user_repo.create(
                email=vet_data.email,
                nombre=vet_data.nombre,
                password_hash=password_hash,
                telefono=vet_data.telefono,
                rol="veterinario"
            )
            await self.db.flush()  # Para obtener el user.id sin cerrar la transacción

            # 3. Creación del Perfil Veterinario
            perfil = await vet_repo.create_perfil(user_id=user.id, perfil_data=vet_data.perfil)

            # 4. Commit transaccional unificado
            await self.db.commit()
            await self.db.refresh(user)
            await self.db.refresh(perfil)

            # 5. Token JWT
            access_token = create_access_token(
                data={"sub": str(user.id), "email": user.email, "rol": user.rol}
            )

            return AuthVeterinarioRegisterResponse(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse.model_validate(user),
                perfil=PerfilVeterinarioResponse.model_validate(perfil)
            )