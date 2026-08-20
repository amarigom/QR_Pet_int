import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

raw_url = os.getenv("DATABASE_URL")

# Limpieza de query string
if raw_url:
    DATABASE_URL = raw_url.split('?')[0]
else:
    DATABASE_URL = raw_url

connect_args = {}
# Configuración SSL para Neon / PostgreSQL remoto
if DATABASE_URL and "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
    connect_args = {"ssl": True}

# Motor de BD con resiliencia de conexiones para Neon
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,    # Verifica si la conexión está viva antes de ejecutar
    pool_recycle=300,      # Recicla conexiones cada 5 min (ideal para Neon)
    pool_size=10,          # Tamaño base del pool
    max_overflow=20,       # Conexiones adicionales permitidas
    echo=False             # Cambiar a True si querés ver SQL en consola
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    """Generador de sesiones asíncronas seguro para FastAPI"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# --- PARCHE TEMPORAL PARA COMPATIBILIDAD ---
class Database:
    @staticmethod
    async def fetch_one(query: str, params=None):
        async with engine.connect() as conn:
            result = await conn.execute(text(query), params or {})
            row = result.fetchone()
            return dict(row._mapping) if row else None

    @staticmethod
    async def fetch_all(query: str, params=None):
        async with engine.connect() as conn:
            result = await conn.execute(text(query), params or {})
            return [dict(row._mapping) for row in result.fetchall()]