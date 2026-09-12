# app/repositories/pet_vector_repository.py

# app/repositories/pet_vector_repository.py

import uuid
import logging
from typing import Optional
from sqlalchemy import select, text
from typing import Any, Dict, List, Optional
from app.models.pet_vector import PetVector  # <--- Importa el modelo aquí


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
        
        
        
    import uuid
import logging
from typing import Any, Dict, Optional
from sqlalchemy import select
from app.models.pet_vector import PetVector

logger = logging.getLogger(__name__)


class PetVectorRepository:
    def __init__(self, db):
        self.db = db

    import uuid
import logging
from typing import Any, Dict, Optional
from app.models.pet_vector import PetVector

logger = logging.getLogger(__name__)


class PetVectorRepository:
    def __init__(self, db):
        self.db = db

    async def index_pet_vector(
        self,
        pet_id: str,
        description: str,
        embedding: list[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Inserta o actualiza un PetVector usando merge() en una sola transacción limpia."""
        try:
            # 1. Convertir pet_id a UUID nativo
            val_uuid = uuid.UUID(pet_id) if isinstance(pet_id, str) else pet_id

            # 2. Crear la entidad ORM con los datos actualizados
            vector_entry = PetVector(
                pet_id=val_uuid,
                document=description,
                embedding=embedding,
                metadata_=metadata or {},
            )

            # 3. merge() decide automáticamente si Insertar o Actualizar sin hacer SELECT previo
            await self.db.merge(vector_entry)
            
            # 4. Impactar cambios en la base de datos
            await self.db.commit()
            return True

        except Exception as e:
            await self.db.rollback()
            logger.error(
                f"Error ORM al sincronizar PetVector (pet_id={pet_id}): {e}",
                exc_info=True,
            )
            return False