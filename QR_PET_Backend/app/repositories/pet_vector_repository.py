from app.services.chroma_service import VectorStoreService

class PetVectorRepository:
    def __init__(self, collection):
        """vector_store/collection es la instancia de chromadb.Collection"""
        self.collection = collection

    def index_pet(self, pet_id: str, description: str, metadata: dict):
        """Persiste o actualiza el embedding de la mascota en ChromaDB."""
        self.collection.upsert(
            ids=[pet_id],
            documents=[description],
            metadatas=[metadata]
        )

    def search_similar(self, query: str, limit: int = 3, where_filter: dict = None):
        """Realiza la búsqueda vectorial en ChromaDB."""
        kwargs = {
            "query_texts": [query],
            "n_results": limit
        }
        if where_filter:
            kwargs["where"] = where_filter
            
        return self.collection.query(**kwargs)