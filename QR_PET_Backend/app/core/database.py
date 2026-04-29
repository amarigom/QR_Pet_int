from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv
from app.config import settings

# Levantamos la URL
raw_url = os.getenv("DATABASE_URL")

# Limpieza absoluta de parámetros de query string
if raw_url:
    # Esto elimina cualquier cosa después del '?' (como sslmode)
    DATABASE_URL = raw_url.split('?')[0]
else:
    DATABASE_URL = raw_url

connect_args = {}
# Forzamos el SSL que Neon necesita para asyncpg
if DATABASE_URL and "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
    connect_args = {"ssl": True}

engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=True
)

# Esto sustituye a tu antigua clase Database
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    
)

# Base para los modelos (User, Pet, etc.)
Base = declarative_base()

# Dependencia para los Endpoints de FastAPI
async def get_db():
    """Generador de sesiones para cada request"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
            
            
            
            # --- PARCHE TEMPORAL PARA COMPATIBILIDAD ---
from sqlalchemy import text

class Database:
    @staticmethod
    async def fetch_one(query: str, params=None):
        from app.core.database import engine
        async with engine.connect() as conn:
            # Si params es un diccionario, SQLAlchemy será feliz
            result = await conn.execute(text(query), params or {})
            row = result.fetchone()
            return dict(row._mapping) if row else None
    @staticmethod
    async def fetch_all(query: str, *args):
        from app.core.database import engine
        async with engine.connect() as conn:
            result = await conn.execute(text(query), args)
            return [dict(row._mapping) for row in result.fetchall()]