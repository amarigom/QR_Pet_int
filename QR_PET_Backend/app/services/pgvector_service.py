import asyncio
import logging
import uuid
from typing import Any, Dict, List, Optional
from app.repositories.pet_vector_repository import PetVectorRepository
from app.repositories.knowledge_repository import KnowledgeRepository

from google.genai import types

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
        owner_type: str = "admin",
        owner_id: Optional[uuid.UUID] = None,
        pet_id: Optional[uuid.UUID] = None,
        source_type: str = "document",
    ) -> bool:
        """Genera el embedding e indexa en Neon."""
        if not contenido or not contenido.strip():
            return False

        # Generar embedding con Gemini
        vector =  await self._get_embedding(contenido, task_type="RETRIEVAL_DOCUMENT")
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
            owner_type=owner_type,
            owner_id=owner_id,
            pet_id=pet_id,
            source_type=source_type,
        )




    async def responder_con_rag(
        self,
        pregunta: str,
        user_id: uuid.UUID,
        user_role: str,
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
        query_vector = await self._get_embedding(
            pregunta_busqueda, task_type="RETRIEVAL_QUERY"
        )

        if not query_vector:
            raise RuntimeError("No se pudo generar el vector de la pregunta.")

        # 3. Búsqueda vectorial en la tabla knowledge_vectors mediante el repositorio
        registros_similares = await self.knowledge_repo.buscar_similares(
            query_vector=query_vector,
            user_id=user_id,
            user_role=user_role,
            categoria=categoria,
            limit=limit if user_role != "veterinario" else limit * 2,
        )

        retrieved = []
        for reg, distance in registros_similares:
            retrieved.append(
                (
                    distance,
                    reg.contenido,
                    {
                        "doc_id": reg.doc_id,
                        "titulo": reg.titulo,
                        "categoria": reg.categoria,
                        "tipo": reg.source_type,
                    },
                )
            )
        if user_role == "veterinario":
            pet_records = await self.repository.search_similar_for_veterinarian(
                query_vector=query_vector,
                veterinarian_id=user_id,
                limit=limit,
            )
            retrieved.extend(
                (
                    distance,
                    content,
                    {
                        "doc_id": f"pet:{pet_id}",
                        "titulo": metadata.get("nombre", "Mascota vinculada"),
                        "categoria": "mascotas",
                        "tipo": "mascota",
                    },
                )
                for pet_id, content, metadata, distance in pet_records
            )
        retrieved.sort(key=lambda item: item[0])
        retrieved = retrieved[: limit + (limit if user_role == "veterinario" else 0)]
        documents = [item[1] for item in retrieved]
        fuentes_unicas = {}
        for _, _, source in retrieved:
            fuentes_unicas[source["doc_id"]] = source

        contexto_unificado = (
            "\n\n---\n\n".join(documents)
            if documents
            else "No se encontró información relevante en la base de conocimientos."
        )

        # 4. Formatear historial reciente para el prompt
        texto_historial = ""
        if historial:
            for message in historial[-6:]:
                if message.get("role") not in ("user", "assistant", "human"):
                    continue
                rol = "Usuario" if message.get("role") in ("user", "human") else "Asistente"
                texto_historial += f"{rol}: {str(message.get('content', ''))[:4000]}\n"

        # 5. Prompt con instrucciones de grounding
        prompt_rag = f"""
Sos el asistente virtual inteligente de la aplicación de mascotas.

INSTRUCCIONES ESTRICTAS:
1. Respondé usando el CONTEXTO OFICIAL recuperado y el HISTORIAL para mantener continuidad.
2. Si la respuesta no está en el contexto, decí con claridad que no disponés de esa información.
3. Sé directo, conciso y cordial. No inventes datos de mascotas ni historias clínicas.
4. Si se pregunta por salud animal y no hay información clínica suficiente, recomendá consultar a un veterinario.
5. La información veterinaria recuperada pertenece exclusivamente a pacientes vinculados al veterinario autenticado; no la reveles ni infieras datos de otros pacientes.

CONTEXTO OFICIAL RECUPERADO:
{contexto_unificado}

HISTORIAL DE LA CONVERSACIÓN:
{texto_historial}

PREGUNTA ACTUAL DEL USUARIO:
{pregunta}
"""

        # 6. Generación de respuesta con Gemini SDK
        try:
            response = await asyncio.to_thread(
                self.ai_client.models.generate_content,
                model="gemini-2.5-flash",
                contents=prompt_rag,
            )
            respuesta_texto = response.text.strip()
        except Exception as e:
            logger.exception("Error al generar respuesta en Gemini.")
            raise RuntimeError("No se pudo generar una respuesta con el asistente.") from e

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