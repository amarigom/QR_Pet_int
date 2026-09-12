import asyncio
import logging
from typing import Optional, List, Dict, Any
from app.repositories.pet_vector_repository import PetVectorRepository
from app.repositories.knowledge_repository import KnowledgeRepository
from typing import Dict, List, Optional
import logging

from google.genai import types

logger = logging.getLogger(__name__)

logger = logging.getLogger("uvicorn.error")


class VectorStoreService:
    def __init__(
        self,
        repository: PetVectorRepository,
        knowledge_repo: KnowledgeRepository,
        ai_client: Any,
        embedding_client: Optional[Any] = None,
    ):
        self.repository = repository
        self.knowledge_repo = knowledge_repo
        self.ai_client = ai_client
        self.embedding_client = embedding_client

    import asyncio

    async def _get_embedding(
        self, text: str, task_type: str = "RETRIEVAL_QUERY"
    ) -> List[float]:
        """Genera el vector asincrónicamente usando gemini-embedding-2."""
        try:
            # Ejecuta la llamada sincrónica en un hilo separado sin congelar el Event Loop
            response = await asyncio.to_thread(
                self.ai_client.models.embed_content,
                model="gemini-embedding-2",
                contents=text,
                config=types.EmbedContentConfig(task_type=task_type),
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.error(f"Error al generar embedding con Gemini: {e}")
            return []

    async def search_similar_pets(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        n_results: int = 3,
    ) -> Dict[str, Any]:
        """
        Genera el embedding de la consulta y realiza la búsqueda en el repositorio.
        """
        if not query or not query.strip():
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}

        # Llamada síncrona a Gemini (sin await)
        query_vector =  await self._get_embedding(query, task_type="RETRIEVAL_QUERY")

        if not query_vector:
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}

        # Mapeo a repositorio Postgres/SQLAlchemy
        return await self.repository.search_similar(
            query_vector=query_vector,
            limit=n_results,
            filters=filters,
        )
        
    async def ingestar_documento(
        self,
        chunk_id: str,
        doc_id: str,
        titulo: str,
        contenido: str,
        categoria: str = "general",
    ) -> bool:
        """Genera el embedding e indexa en Neon."""
        if not contenido or not contenido.strip():
            return False

        # Generar embedding con Gemini
        vector = self._get_embedding(contenido, task_type="RETRIEVAL_DOCUMENT")
        if not vector:
            return False

        # Guardar en repositorio de conocimiento
        return await self.knowledge_repo.index_document(
            chunk_id=chunk_id,
            doc_id=doc_id,
            titulo=titulo,
            contenido=contenido,
            categoria=categoria,
            embedding=vector,
        )




    async def responder_con_rag(
        self,
        pregunta: str,
        historial: Optional[List[Dict[str, str]]] = None,
        categoria: Optional[str] = None,
        limit: int = 3,
    ) -> dict:
        """Efectúa la búsqueda vectorial en Neon (pgvector) y genera la respuesta contextualizada."""
        historial = historial or []

        # 1. Reformulación de consulta con el historial (asumiendo que mantienes esta función interna)
        pregunta_busqueda = (
            self._reescribir_pregunta_con_historial(pregunta, historial)
            if hasattr(self, "_reescribir_pregunta_con_historial")
            else pregunta
        )

        # 2. Vectorizar la consulta
        query_vector = self._get_embedding(
            pregunta_busqueda, task_type="RETRIEVAL_QUERY"
        )

        if not query_vector:
            return {
                "respuesta": "No pude procesar tu pregunta en este momento. Por favor intenta más tarde.",
                "fuentes": [],
            }

        # 3. Búsqueda vectorial en la tabla knowledge_vectors mediante el repositorio
        registros_similares = await self.knowledge_repo.buscar_similares(
            query_vector=query_vector,
            categoria=categoria,
            limit=limit,
        )

        # Formatear documentos y fuentes desde el modelo ORM (KnowledgeVector)
        documents = [reg.contenido for reg in registros_similares]
        
        fuentes_unicas = {}
        for reg in registros_similares:
            if reg.doc_id not in fuentes_unicas:
                fuentes_unicas[reg.doc_id] = {
                    "doc_id": reg.doc_id,
                    "titulo": reg.titulo,
                    "categoria": reg.categoria,
                }

        contexto_unificado = (
            "\n\n---\n\n".join(documents)
            if documents
            else "No se encontró información relevante en la base de conocimientos."
        )

        # 4. Formatear historial reciente para el prompt
        texto_historial = ""
        if historial:
            for m in historial[-6:]:
                rol = "Usuario" if m.get("role") in ["user", "human"] else "Asistente"
                texto_historial += f"{rol}: {m.get('content')}\n"

        # 5. Prompt con instrucciones de grounding
        prompt_rag = f"""
Sos el asistente virtual inteligente de la aplicación de mascotas.

INSTRUCCIONES ESTRICTAS:
1. Respondé a la pregunta del usuario utilizando la información del CONTEXTO OFICIAL recuperado.
2. Tené en cuenta el HISTORIAL DE CONVERSACIÓN para mantener la continuidad de la charla.
3. Si la respuesta no está en el contexto, indicá amablemente que no disponés de esa información específica.
4. Sé directo, conciso y cordial.

CONTEXTO OFICIAL RECUPERADO:
{contexto_unificado}

HISTORIAL DE LA CONVERSACIÓN:
{texto_historial}

PREGUNTA ACTUAL DEL USUARIO:
{pregunta}
"""

        # 6. Generación de respuesta con Gemini SDK
        try:
            response = self.ai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_rag,
            )
            respuesta_texto = response.text.strip()
        except Exception as e:
            logger.error(f"Error al generar respuesta en Gemini: {e}")
            respuesta_texto = "Ocurrió un error al generar la respuesta con la inteligencia artificial."

        # 7. Retornar contrato de respuesta
        return {
            "respuesta": respuesta_texto,
            "fuentes": list(fuentes_unicas.values()),
        }

    async def add_pet(
        self,
        pet_id: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Genera el embedding de Gemini e indexa una mascota en pet_vectors."""
        if not description or not description.strip():
            return False

        # Genera el vector para la mascota
        vector = await self._get_embedding(description, task_type="RETRIEVAL_DOCUMENT")
        if not vector:
            return False

        # Guarda en el repositorio de mascotas
        return await self.repository.index_pet_vector(
            pet_id=pet_id,
            description=description,
            embedding=vector,
            metadata=metadata or {},
           
        )