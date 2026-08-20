import os
import chromadb
from google import genai
from google.genai import types
from typing import List, Dict,Optional



class VectorStoreService:

    def __init__(self, collection_name: str = "pets_vectors_v2", knowledge_collection_name: str = "knowledge_base_v1"):
        self.collection_name = collection_name
        self.knowledge_collection_name = knowledge_collection_name
        self.ai_client = None
        self.chroma_client = None
        self.collection = None
        self.knowledge_collection = None
        
        # Inicialización perezosa (lazy)
        self._init_clients()
    
    def _init_clients(self):
        # 1. Gemini Client
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                self.ai_client = genai.Client(api_key=api_key)
            except Exception as e:
                logging.error(f"Error iniciando Gemini Client: {e}")

        # 2. ChromaDB Client con aislamiento de errores
        try:
            import chromadb
            
            if os.getenv("VERCEL"):
                # En Vercel forzamos almacenamiento efímero sin guardar en disco
                self.chroma_client = chromadb.Client()
            else:
                CHROMA_PATH = os.path.join(os.path.abspath("."), "chroma_db")
                self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name
            )
            self.knowledge_collection = self.chroma_client.get_or_create_collection(
                name=self.knowledge_collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        except Exception as e:
            # Si ChromaDB falla en el entorno Serverless de Vercel,
            # no interrumpe la carga global de la API FastAPI.
            logging.error(f"ChromaDB no pudo inicializarse en este entorno: {e}")
            self.chroma_client = None
            self.collection = None
            self.knowledge_collection = None
# ==========================================
    # MÉTODOS PRIVADOS / AUXILIARES
    # ==========================================
    
    def _get_embedding(
        self, text: str, task_type: str = "RETRIEVAL_QUERY"
    ) -> list[float]:
        """Genera el vector usando gemini-embedding-2 (Retorna 3072 dimensiones)."""
        response = self.ai_client.models.embed_content(
            model="gemini-embedding-2",
            contents=text,
            config=types.EmbedContentConfig(task_type=task_type),
        )
        return response.embeddings[0].values


    def _reescribir_pregunta_con_historial(
            self, pregunta: str, historial: List[Dict[str, str]]
        ) -> str:
            """Reformula la pregunta del usuario considerando el contexto del historial."""
            if not historial:
                return pregunta

            charla_previa = ""
            for m in historial[-4:]:
                rol = "Usuario" if m.get("role") in ["user", "human"] else "Asistente"
                charla_previa += f"{rol}: {m.get('content')}\n"

            prompt_reformular = f"""
    Dada la siguiente conversación previa y la última pregunta del usuario, reformulá la última pregunta para que sea una consulta completa y autosuficiente (sin pronombres ambiguos) para buscar en una base de datos.
    NO respondas la pregunta, solo devolvé la pregunta reformulada. Si la pregunta ya es clara y completa, devolvela tal cual.

    CONVERSACIÓN PREVIA:
    {charla_previa}

    ÚLTIMA PREGUNTA: {pregunta}

    PREGUNTA REFORMULADA:"""

            try:
                response = self.ai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt_reformular,
                )
                pregunta_reformulada = response.text.strip()
                return pregunta_reformulada if pregunta_reformulada else pregunta
            except Exception:
                return pregunta

# ==========================================
    # GESTIÓN DE MASCOTAS (Mascotas V2)
# ==========================================


    def add_pet(
        self, pet_id: str, description: str, metadata: dict | None = None
    ):
        """Guarda una mascota con su texto, vector y metadatos opcionales."""
        vector = self._get_embedding(
            description, task_type="RETRIEVAL_DOCUMENT"
        )

        self.collection.add(
            ids=[pet_id],
            documents=[description],
            embeddings=[vector],
            metadatas=[metadata] if metadata else None,
        )

    
        
    def search_similar_pets(
    self,
    query: str,
    filters: dict | None = None,
    n_results: int = 3,
):
        """Busca mascotas por similitud semántica aplicando filtros de metadatos opcionales."""
        query_vector = self._get_embedding(query, task_type="RETRIEVAL_QUERY")

        # Construimos el diccionario 'where' de ChromaDB a partir de los filtros recibidos
        where_clause = None
        if filters:
            # Eliminamos claves con valor None por si vienen query params vacíos desde la API
            clean_filters = {k: v for k, v in filters.items() if v is not None}

            if len(clean_filters) == 1:
                where_clause = clean_filters
            elif len(clean_filters) > 1:
                # Si hay más de un filtro, ChromaDB requiere el operador $and
                where_clause = {
                    "$and": [{k: {"$eq": v}} for k, v in clean_filters.items()]
                }

        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=n_results,
            where=where_clause,  # ChromaDB filtra directamente aquí
        )
        return results
    
    def get_pet_with_vector(self, pet_id: str):
        """Devuelve los datos de una mascota incluyendo su vector numérico."""
        return self.collection.get(
            ids=[pet_id], include=["embeddings", "documents", "metadatas"]
        )
        
    # ==========================================
    # INGESTIÓN DE CONOCIMIENTO (Invocado por el Router)
    # ==========================================

    def ingestar_documento(
        self, doc_id: str, titulo: str, contenido: str, categoria: str = "general"
    ) -> bool:
        """Persiste el embedding y texto procesado desde el router de ingestión."""
        vector = self._get_embedding(contenido, task_type="RETRIEVAL_DOCUMENT")

        self.knowledge_collection.add(
            ids=[doc_id],
            embeddings=[vector],
            documents=[contenido],
            metadatas=[{
                "doc_id": doc_id,
                "titulo": titulo,
                "categoria": categoria,
            }],
        )
        return True 
    
    # ==========================================
    # CONSULTA Y GENERACIÓN RAG
    # ==========================================   
        
    def responder_con_rag(
        self,
        pregunta: str,
        historial: Optional[List[Dict[str, str]]] = None,
        categoria: Optional[str] = None,
        limit: int = 3,
    ) -> dict:
        """Efectúa la búsqueda vectorial y genera la respuesta contextualizada."""
        historial = historial or []

        # 1. Reformulación de consulta con el historial
        pregunta_busqueda = self._reescribir_pregunta_con_historial(
            pregunta, historial
        )

        # 2. Vectorizar la consulta
        query_vector = self._get_embedding(
            pregunta_busqueda, task_type="RETRIEVAL_QUERY"
        )

        # 3. Filtrado y consulta en la base de conocimientos
        where_filter = {"categoria": categoria} if categoria else None

        results = self.knowledge_collection.query(
            query_embeddings=[query_vector],
            n_results=limit,
            where=where_filter,
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

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

        # 6. Generación de respuesta con Gemini
        response = self.ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_rag,
        )

        # 7. Formatear fuentes
        fuentes_unicas = {}
        for meta in metadatas:
            doc_id = meta.get("doc_id", "desconocido")
            if doc_id not in fuentes_unicas:
                fuentes_unicas[doc_id] = {
                    "doc_id": doc_id,
                    "titulo": meta.get("titulo", "Sin título"),
                    "categoria": meta.get("categoria", "general"),
                }

        return {
            "respuesta": response.text.strip(),
            "fuentes": list(fuentes_unicas.values()),
        }

    