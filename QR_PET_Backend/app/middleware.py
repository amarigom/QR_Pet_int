from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.config import settings
from app.core.database import engine
from app.utils.logger import logger

def setup_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        # Especifica el origen exacto de tu Next.js
        allow_origins=["http://localhost:3000","http://localhost:8000","http://qr-pet-int-.*.vercel.app"], 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    @app.get("/health", tags=["Health"])
    async def health_check():
        try:
            # Intentamos una consulta simple
            from sqlalchemy import text
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "ok", "db": "connected"}
        except Exception as e:
            return {"status": "error", "detail": str(e)} # Esto nos va a mostrar el error real en pantalla
        #return {"status": "ok", "orm": "sqlalchemy", "version": settings.API_VERSION}


    