from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select
from app.models.veterinario import PerfilVeterinario
from app.models.user import User
from app.models.veterinario_cliente import veterinario_clientes

class VeterinarioRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_perfil(self, user_id: UUID, perfil_data) -> PerfilVeterinario:
        perfil = PerfilVeterinario(
            user_id=user_id,
            nombre_clinica=perfil_data.nombre_clinica,
            matricula=perfil_data.matricula,
            especialidad=perfil_data.especialidad,
            direccion_consultorio=perfil_data.direccion_consultorio,
            telefono_agenda=perfil_data.telefono_agenda
        )
        self.db.add(perfil)
        return perfil

    async def get_by_user_id(self, user_id: UUID) -> Optional[PerfilVeterinario]:
        query = select(PerfilVeterinario).where(PerfilVeterinario.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def matricula_exists(self, matricula: str) -> bool:
        query = select(PerfilVeterinario).where(PerfilVeterinario.matricula == matricula)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_active_profile(self, user_id: UUID) -> Optional[PerfilVeterinario]:
        result = await self.db.execute(
            select(PerfilVeterinario).where(
                PerfilVeterinario.user_id == user_id,
                PerfilVeterinario.activo.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def update_active_profile_logo(
        self, user_id: UUID, logo_url: str
    ) -> Optional[PerfilVeterinario]:
        profile = await self.get_active_profile(user_id)
        if profile is None:
            return None
        profile.logo_url = logo_url
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def create_linked_client(self, veterinarian_id: UUID, client: User) -> User:
        try:
            self.db.add(client)
            await self.db.flush()
            await self.db.execute(
                insert(veterinario_clientes).values(
                    veterinario_id=veterinarian_id,
                    cliente_id=client.id,
                )
            )
            await self.db.commit()
            await self.db.refresh(client)
            return client
        except Exception:
            await self.db.rollback()
            raise

    async def get_pending_linked_client(
        self, veterinarian_id: UUID, client_id: UUID
    ) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .join(veterinario_clientes, veterinario_clientes.c.cliente_id == User.id)
            .where(
                veterinario_clientes.c.veterinario_id == veterinarian_id,
                User.id == client_id,
                User.pending_activation.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def update_client_activation(
        self,
        client: User,
        token_hash: str,
        expires_at,
    ) -> User:
        client.activation_token_hash = token_hash
        client.activation_token_expires_at = expires_at
        await self.db.commit()
        await self.db.refresh(client)
        return client

    async def get_pending_activation_by_hash(self, token_hash: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(
                User.activation_token_hash == token_hash,
                User.pending_activation.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def activate_client(
        self, client: User, password_hash: str
    ) -> User:
        client.password_hash = password_hash
        client.pending_activation = False
        client.activation_token_hash = None
        client.activation_token_expires_at = None
        await self.db.commit()
        await self.db.refresh(client)
        return client
