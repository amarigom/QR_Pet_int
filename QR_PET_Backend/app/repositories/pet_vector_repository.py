# app/repositories/pet_vector_repository.py

import logging
from typing import Optional
from sqlalchemy import select, text
from app.models.pet_vector import PetVector

logger = logging.getLogger(__name__)


class PetVectorRepository:
    def __init__(self, db):
        self.db = db

    async def search_similar(
        self, 
        query_vector: list[float], 
        limit: int = 3,
        filters: Optional[dict] = None
    ) -> dict:
        """
        Realiza la búsqueda por similitud de coseno en Postgres con pgvector + SQLAlchemy.
        """
        try:
            cosine_distance = PetVector.embedding.cosine_distance(query_vector).label("distance")

            stmt = select(
                PetVector.id,
                PetVector.document,
                PetVector.metadata_,  # 👈 Atributo en el modelo de SQLAlchemy
                cosine_distance,
            )

            if filters:
                for key, value in filters.items():
                    if value is not None:
                        stmt = stmt.where(
                            text(f"metadata->>'{key}' ILIKE :val_{key}")
                        ).params({f"val_{key}": f"%{value}%"})

            stmt = stmt.order_by(cosine_distance).limit(limit)
            
            # 👈 Agregado await porque self.db es un AsyncSession
            result = await self.db.execute(stmt)
            rows = result.all()

            if not rows:
                return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}

            ids = [str(r[0]) for r in rows]
            documents = [r[1] for r in rows]
            metadatas = [r[2] if isinstance(r[2], dict) else {} for r in rows]
            distances = [float(r[3]) for r in rows]

            return {
                "ids": [ids],
                "documents": [documents],
                "metadatas": [metadatas],
                "distances": [distances],
            }

        except Exception as e:
            logger.error(f"Error al buscar vectores en Postgres vía SQLAlchemy: {e}")
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}