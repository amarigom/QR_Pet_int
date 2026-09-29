from uuid import UUID
from typing import Optional,Union
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.veterinario_repository import VeterinarioRepository
from app.schemas.veterinario import (
    RegistroVeterinarioCreate,
    PerfilVeterinarioCreate,
    PerfilVeterinarioUpdate,
    AuthVeterinarioRegisterResponse,
    PerfilVeterinarioResponse,
)
from app.schemas.user import UserResponse
from app.core.auth import hash_password, create_access_token
from app.core.exceptions import AuthenticationException


class VeterinarioService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = VeterinarioRepository(db)

    async def registrar_veterinario(
        self, datos: RegistroVeterinarioCreate
    ) -> AuthVeterinarioRegisterResponse:
        """
        Registra un nuevo usuario con rol de veterinario y crea su perfil profesional.
        """
        # 1. Validar que el email no esté registrado
        user_existente = await self.repository.get_user_by_email(datos.email)
        if user_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya se encuentra registrado."
            )

        # 2. Validar que la matrícula no exista previamente
        if await self.repository.matricula_exists(datos.perfil.matricula):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La matrícula profesional ingresada ya está asociada a otra cuenta."
            )

        # 3. Hashear la contraseña
        password_hash = get_password_hash(datos.password)

        # 4. Crear usuario y perfil en la BD
        user, perfil = await self.repository.create_veterinario_completo(
            datos=datos,
            password_hash=password_hash
        )

        # 5. Generar token de acceso JWT
        access_token = create_access_token(
            subject=str(user.id),
            extra_claims={"rol": user.rol}
        )

        return AuthVeterinarioRegisterResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
            perfil=PerfilVeterinarioResponse.model_validate(perfil)
        )

    async def obtener_perfil_por_usuario(self, user_id: UUID) -> PerfilVeterinarioResponse:
        """
        Obtiene el perfil profesional del veterinario dado su user_id.
        """
        perfil = await self.repository.get_by_user_id(user_id)
        if not perfil:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil veterinario no encontrado."
            )
        return PerfilVeterinarioResponse.model_validate(perfil)