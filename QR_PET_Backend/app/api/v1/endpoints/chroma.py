import os
import chromadb

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.v1.dependencies import (
    get_vector_store_service,
    get_pet_repository,
    get_pet_vector_repository,
)
from app.repositories.pet_repository import PetRepository
from app.repositories.pet_vector_repository import PetVectorRepository
from app.services.chroma_service import VectorStoreService

router = APIRouter()

# Instancia global configurada explícitamente en v2 (3072 dimensiones)
vector_service = VectorStoreService(collection_name="pets_vectors_v2")


class PetVectorInput(BaseModel):
    pet_id: str
    description: str
    metadata: Optional[Dict[str, Any]] = None


BATCH_SIZE = 100


import os
import logging
import chromadb
from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger("uvicorn.error")

@router.post("/sincronizar-todo")
async def sincronizar_base_de_datos(
    pet_repo: PetRepository = Depends(get_pet_repository),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    try:
        total_mascotas = await pet_repo.count_all()

        if total_mascotas == 0:
            return {
                "message": "No hay mascotas en la base de datos para sincronizar",
                "total": 0,
            }

        # ---------------------------------------------------------------------
        # PASO CLAVE: Limpieza previa de la colección para resetear a 3072 dims
        # ---------------------------------------------------------------------
        col_name = getattr(v_service, "collection_name", "pets_vectors_v2")
        
        if hasattr(v_service, "chroma_client") and v_service.chroma_client:
            chroma_client = v_service.chroma_client
        else:
            CHROMA_PATH = os.path.join(os.path.abspath("."), "chroma_db")
            chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

        try:
            chroma_client.delete_collection(name=col_name)
        except Exception:
            pass  # Si no existía, continúa de largo

        v_service.collection = chroma_client.get_or_create_collection(
            name=col_name,
            metadata={"hnsw:space": "cosine"}
        )
        # ---------------------------------------------------------------------

        registros_procesados = 0

        for offset in range(0, total_mascotas, BATCH_SIZE):
            mascotas_batch = await pet_repo.get_paginated(
                offset=offset, limit=BATCH_SIZE
            )

            for pet in mascotas_batch:
                nombre = getattr(pet, "nombre", "") or ""
                especie = getattr(pet, "especie", "") or ""
                raza = getattr(pet, "raza", "") or ""
                nota = getattr(pet, "notas", getattr(pet, "notes", getattr(pet, "descripcion", ""))) or ""

                texto_completo = f"Nombre: {nombre}. Especie: {especie}. Raza: {raza}. Detalles: {nota}".strip()

                metadata = {
                    "especie": (especie or "").lower(),
                    "raza": (raza or "").lower(),
                    "color": (getattr(pet, "color", "") or "").lower(),
                    "estado": (getattr(pet, "estado", "") or "").lower(),
                }

                try:
                    # Usamos add_pet directamente del servicio
                    v_service.add_pet(
                        pet_id=str(pet.id),
                        description=texto_completo,
                        metadata=metadata
                    )
                    registros_procesados += 1
                except Exception as embed_err:
                    logger.error(f"Error indexando mascota ID {pet.id}: {embed_err}")

        return {
            "status": "success",
            "message": f"Se sincronizaron correctamente {registros_procesados} mascotas en ChromaDB (3072 dims)",
            "total_registros": total_mascotas,
            "lotes_procesados": (total_mascotas + BATCH_SIZE - 1) // BATCH_SIZE,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la sincronización con ChromaDB: {str(e)}",
        )
@router.post("/indexar", status_code=201)
def indexar_mascota(
    data: PetVectorInput,
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Guarda o actualiza una mascota en ChromaDB con su embedding vectorial."""
    try:
        v_service.add_pet(
            pet_id=data.pet_id,
            description=data.description,
            metadata=data.metadata,
        )
        return {
            "status": "success",
            "message": f"Mascota {data.pet_id} indexada correctamente.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/buscar")
def buscar_mascota(
    query: str = Query(
        ..., description="Descripción o consulta en lenguaje natural"
    ),
    especie: Optional[str] = Query(
        None, description="Filtro opcional por especie (ej: perro, gato)"
    ),
    raza: Optional[str] = Query(
        None, description="Filtro opcional por raza"
    ),
    color: Optional[str] = Query(None, description="Filtro opcional por color"),
    estado: Optional[str] = Query(
        None, description="Filtro opcional por estado (ej: perdido, encontrado)"
    ),
    limit: int = Query(
        3, ge=1, le=20, description="Cantidad de resultados a retornar"
    ),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Busca mascotas por similitud semántica."""
    try:
        filters = {}
        if especie:
            filters["especie"] = especie
        if raza:
            filters["raza"] = raza
        if color:
            filters["color"] = color
        if estado:
            filters["estado"] = estado

        resultados = v_service.search_similar_pets(
            query=query, filters=filters if filters else None, n_results=limit
        )
        return {
            "status": "success",
            "query": query,
            "filtros_aplicados": filters,
            "resultados": resultados,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Endpoints de prueba para verificar conectividad con Gemini
# ------------------------------------------------------------------


@router.get("/test-gemini")
def test_gemini(
    prompt: str = "Dame un saludo corto para un perro llamado Toby",
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Prueba de generación de contenido con gemini-2.5-flash."""
    try:
        response = v_service.ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return {
            "status": "success",
            "prompt": prompt,
            "respuesta": response.text,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-embedding")
def test_embedding(
    texto: str = "Un perro labrador de color dorado",
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Prueba de vectorización con gemini-embedding-2."""
    try:
        vector = v_service._get_embedding(texto)
        return {
            "status": "success",
            "modelo_usado": "gemini-embedding-2",
            "texto_original": texto,
            "dimensiones": len(vector),
            "vector_ejemplo": vector[:5],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))