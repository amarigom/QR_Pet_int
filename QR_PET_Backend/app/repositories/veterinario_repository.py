from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.veterinario import PerfilVeterinario

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