from typing import Optional, List
from sqlalchemy import select,func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository[User]):
    """Repository para la tabla usuarios con lógica de datos pura"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(model=User, session=session)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Busca un usuario por su email de forma exacta"""
        query = select(User).where(User.email == email)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    # Nota: El método create() genérico del BaseRepository es suficiente.
    # El Service le pasará el password_hash y demás campos validados.

    async def get_all_admins(self) -> List[User]:
        """Obtiene todos los administradores del sistema"""
        query = (
            select(User)
            .where(User.rol == "admin")
            .order_by(User.created_at.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def email_exists(self, email: str) -> bool:
        """Verifica existencia de email de forma eficiente"""
        query = select(User.id).where(User.email == email).limit(1)
        result = await self.session.execute(query)
        return result.scalar() is not None
    
    async def list(self, limit: int = 100, offset: int = 0):
        """Obtiene una lista de usuarios con paginación"""
        query = select(User).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count(self) -> int:
        """Cuenta el total de usuarios (útil para la paginación)"""
        query = select(func.count(User.id))
        result = await self.session.execute(query)
        return result.scalar() or 0
    
    from uuid import UUID
    async def update_user(self, user_id: UUID, telefono: Optional[str] = None, nombre: Optional[str] = None, avatar_url: Optional[str] = None, direccion: Optional[str] = None) -> Optional[User]:
            """Busca al usuario y actualiza selectivamente sus campos en memoria."""
            query = select(User).where(User.id == user_id)
            result = await self.session.execute(query)
            user_record = result.scalar_one_or_none()

            if not user_record:
                return None

            if telefono is not None:
                user_record.telefono = telefono
            if nombre is not None:
                user_record.nombre = nombre
            if avatar_url is not None:
                user_record.avatar_url = avatar_url
            if direccion is not None:
                user_record.direccion = direccion

            return user_record