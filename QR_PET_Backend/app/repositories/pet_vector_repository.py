from app.services.chroma_service import VectorStoreService

import logging

class PetVectorRepository:
    def __init__(self, collection):
        """collection es la instancia de chromadb.Collection o None (si falló en Vercel)"""
        self.collection = collection

    def index_pet(self, pet_id: str, description: str, metadata: dict):
        """Persiste o actualiza el embedding de la mascota en ChromaDB."""
        if not self.collection:
            logging.warning("ChromaDB no disponible. Omitiendo indexación de mascota.")
            return False

        self.collection.upsert(
            ids=[pet_id],
            documents=[description],
            metadatas=[metadata]
        )
        return True

    def search_similar(self, query: str, limit: int = 3, where_filter: dict = None):
        """Realiza la búsqueda vectorial en ChromaDB."""
        if not self.collection:
            logging.warning("ChromaDB no disponible en este entorno Serverless.")
            # Retorna una estructura vacía equivalente al formato de ChromaDB
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}

        kwargs = {
            "query_texts": [query],
            "n_results": limit
        }
        if where_filter:
            kwargs["where"] = where_filter
            
        return self.collection.query(**kwargs)