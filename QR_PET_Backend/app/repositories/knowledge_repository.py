# app/repositories/knowledge_repository.py
import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.conocimiento import KnowledgeVector

logger = logging.getLogger("uvicorn.error")


class KnowledgeRepository:
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def index_document(
        self,
        chunk_id: str,
        doc_id: str,
        titulo: str,
        contenido: str,
        categoria: str,
        embedding: List[float],
    ) -> bool:
        try:
            # Buscamos por doc_id (VARCHAR) en lugar de id (INTEGER)
            query = select(KnowledgeVector).where(KnowledgeVector.doc_id == chunk_id)
            result = await self.db.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                existing.doc_id = chunk_id
                existing.titulo = titulo
                existing.contenido = contenido
                existing.categoria = categoria
                existing.embedding = embedding
            else:
                doc_record = KnowledgeVector(
                    doc_id=chunk_id,
                    titulo=titulo,
                    contenido=contenido,
                    categoria=categoria,
                    embedding=embedding,
                )
                self.db.add(doc_record)

            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error indexando en conocimiento: {e}")
            return False
        
        
    async def buscar_similares(
        self,
        query_vector: List[float],
        categoria: Optional[str] = None,
        limit: int = 3,
    ) -> List[KnowledgeVector]:
        """Realiza la búsqueda K-NN de fragmentos más cercanos usando pgvector."""
        try:
            stmt = select(KnowledgeVector)

            # Filtro opcional por categoría
            if categoria and categoria != "general":
                stmt = stmt.where(KnowledgeVector.categoria == categoria)

            # Ordenar por distancia L2 (o usa .cosine_distance(query_vector))
            stmt = stmt.order_by(KnowledgeVector.embedding.l2_distance(query_vector)).limit(limit)

            result = await self.db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error en consulta de similitud vectorial: {e}")
            return []