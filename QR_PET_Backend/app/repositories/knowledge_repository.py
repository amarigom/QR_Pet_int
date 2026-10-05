# app/repositories/knowledge_repository.py
import logging
import uuid
from typing import Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, or_, select
from app.models.conocimiento import KnowledgeVector
from app.models.veterinario_cliente import veterinario_clientes

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
        owner_type: str = "admin",
        owner_id: Optional[uuid.UUID] = None,
        pet_id: Optional[uuid.UUID] = None,
        source_type: str = "document",
    ) -> bool:
        try:
            query = select(KnowledgeVector).where(
                KnowledgeVector.doc_id == doc_id,
                KnowledgeVector.chunk_id == chunk_id,
                KnowledgeVector.owner_type == owner_type,
                KnowledgeVector.owner_id.is_(None)
                if owner_id is None
                else KnowledgeVector.owner_id == owner_id,
            )
            result = await self.db.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                existing.titulo = titulo
                existing.contenido = contenido
                existing.categoria = categoria
                existing.embedding = embedding
                existing.pet_id = pet_id
                existing.source_type = source_type
            else:
                doc_record = KnowledgeVector(
                    doc_id=doc_id,
                    chunk_id=chunk_id,
                    titulo=titulo,
                    contenido=contenido,
                    categoria=categoria,
                    embedding=embedding,
                    owner_type=owner_type,
                    owner_id=owner_id,
                    pet_id=pet_id,
                    source_type=source_type,
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
        user_id: uuid.UUID,
        user_role: str,
        categoria: Optional[str] = None,
        limit: int = 3,
    ) -> List[tuple[KnowledgeVector, float]]:
        """Busca fragmentos relevantes solo dentro del alcance permitido al usuario."""
        allowed_scopes = [KnowledgeVector.owner_type == "admin"]
        if user_role == "veterinario":
            allowed_scopes.append(
                (KnowledgeVector.owner_type == "veterinarian")
                & (KnowledgeVector.owner_id == user_id)
            )
        elif user_role == "usuario":
            linked_veterinarians = select(veterinario_clientes.c.veterinario_id).where(
                veterinario_clientes.c.cliente_id == user_id
            )
            allowed_scopes.append(
                (KnowledgeVector.owner_type == "veterinarian")
                & KnowledgeVector.owner_id.in_(linked_veterinarians)
                & (KnowledgeVector.source_type == "document")
            )
        distance = KnowledgeVector.embedding.cosine_distance(query_vector).label("distance")
        stmt = select(KnowledgeVector, distance).where(or_(*allowed_scopes))
        if categoria and categoria != "general":
            stmt = stmt.where(KnowledgeVector.categoria == categoria)
        stmt = stmt.order_by(distance).limit(limit)
        result = await self.db.execute(stmt)
        return [(row[0], float(row[1])) for row in result]

    async def listar_documentos(
        self, user_id: uuid.UUID, user_role: str
    ) -> list[dict[str, Any]]:
        scopes = [KnowledgeVector.owner_type == "admin"]
        if user_role == "admin":
            scopes = [KnowledgeVector.owner_type == "admin"]
        elif user_role == "veterinario":
            scopes.append(
                (KnowledgeVector.owner_type == "veterinarian")
                & (KnowledgeVector.owner_id == user_id)
            )
        else:
            raise ValueError("El rol no puede consultar documentos de conocimiento.")

        rows = await self.db.execute(
            select(
                func.min(KnowledgeVector.doc_id).label("doc_id"),
                func.max(KnowledgeVector.titulo).label("titulo"),
                func.max(KnowledgeVector.categoria).label("categoria"),
                KnowledgeVector.source_type.label("source_type"),
                func.bool_or(KnowledgeVector.owner_type == "admin").label("compartido"),
            )
            .where(or_(*scopes))
            .group_by(
                KnowledgeVector.titulo,
                KnowledgeVector.categoria,
                KnowledgeVector.source_type,
                KnowledgeVector.owner_type,
                KnowledgeVector.owner_id,
            )
            .order_by(func.max(KnowledgeVector.titulo).asc())
        )
        return [
            {
                "doc_id": row.doc_id,
                "titulo": row.titulo,
                "categoria": row.categoria,
                "source_type": row.source_type,
                "compartido": row.compartido,
            }
            for row in rows
        ]