from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User
from app.models.veterinario import PerfilVeterinario
from app.schemas.veterinario import RegistroVeterinarioCreate
from app.core.constants import UserRole


class VeterinarioRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: UUID) -> Optional[PerfilVeterinario]:
        query = select(PerfilVeterinario).where(PerfilVeterinario.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def matricula_exists(self, matricula: str) -> bool:
        query = select(PerfilVeterinario).where(PerfilVeterinario.matricula == matricula)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def create_veterinario_completo(
        self, datos: RegistroVeterinarioCreate, password_hash: str
    ) -> tuple[User, PerfilVeterinario]:
        try:
            # 1. Instanciar User con tus atributos exactos
            nuevo_usuario = User(
                email=datos.email,
                password_hash=password_hash,
                nombre=datos.nombre,
                telefono=datos.telefono,
                rol=UserRole.VETERINARIO if hasattr(UserRole, 'VETERINARIO') else "veterinario",
            )
            self.db.add(nuevo_usuario)
            await self.db.flush()  # Genera nuevo_usuario.id

            # 2. Instanciar PerfilVeterinario
            nuevo_perfil = PerfilVeterinario(
                user_id=nuevo_usuario.id,
                nombre_clinica=datos.perfil.nombre_clinica,
                matricula=datos.perfil.matricula,
                especialidad=datos.perfil.especialidad,
                direccion_consultorio=datos.perfil.direccion_consultorio,
                telefono_agenda=datos.perfil.telefono_agenda,
            )
            self.db.add(nuevo_perfil)

            await self.db.commit()
            await self.db.refresh(nuevo_usuario)
            await self.db.refresh(nuevo_perfil)

            return nuevo_usuario, nuevo_perfil
        except Exception:
            await self.db.rollback()
            raise