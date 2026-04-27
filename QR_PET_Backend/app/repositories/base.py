import uuid
from typing import List, Optional, Any, Generic, TypeVar, Type
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    """Clase base para repositorios con control de sesión externo"""
    
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: Any) -> Optional[T]:
        """
        Obtiene un registro por ID. 
        Asumimos que el ID ya viene en el tipo correcto gracias a Pydantic.
        """
        query = select(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[T]:
        """Obtiene todos los registros ordenados por fecha de creación"""
        query = (
            select(self.model)
            .order_by(self.model.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self) -> int:
        """Cuenta el total de registros"""
        query = select(func.count()).select_from(self.model)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def create(self, **kwargs) -> T:
        """
        Crea una instancia, la agrega a la sesión pero NO hace commit.
        El Service decidirá cuándo confirmar.
        """
        instance = self.model(**kwargs)
        self.session.add(instance)
        # Flush envía los cambios a la DB para obtener el ID generado
        # pero permite seguir trabajando en la misma transacción.
        await self.session.flush()
        return instance

    async def delete(self, id: Any) -> bool:
        """
        Marca un registro para eliminación. 
        NO hace commit, el Service debe hacerlo.
        """
        query = delete(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.rowcount > 0

    async def exists(self, id: Any) -> bool:
        """Verifica existencia de forma eficiente"""
        query = select(self.model.id).where(self.model.id == id).limit(1)
        result = await self.session.execute(query)
        return result.scalar() is not None