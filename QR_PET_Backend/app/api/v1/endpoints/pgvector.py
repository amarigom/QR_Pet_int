import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import (
    get_db,
    get_pet_service,
    get_vector_store_service,
)
from app.services.pet_service import PetService
from app.services.pet_service import VectorStoreService

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

BATCH_SIZE = 100


class PetVectorInput(BaseModel):
    pet_id: str
    description: str
    metadata: Optional[Dict[str, Any]] = None


@router.post("/sincronizar-todo")
async def sincronizar_base_de_datos(
    pet_service: PetService = Depends(get_pet_service),
    db: AsyncSession = Depends(get_db),
):
    """Limpia la tabla knowledge_vectors en Postgres e indexa masivamente todas las mascotas."""
    try:
        resultado = await pet_service.sincronizar_vectores(db)
        return resultado
    except Exception as e:
        logger.error(f"Error durante la sincronización vectorial: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la sincronización con Postgres pgvector: {str(e)}",
        )


@router.post("/indexar", status_code=201)
async def indexar_mascota(
    data: PetVectorInput,
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Guarda o actualiza una mascota en Postgres con su embedding vectorial."""
    try:
        exito = await v_service.add_pet(
            pet_id=data.pet_id,
            description=data.description,
            metadata=data.metadata,
        )
        if not exito:
            raise HTTPException(
                status_code=500, detail="No se pudo persistir el vector en la base de datos."
            )
        return {
            "status": "success",
            "message": f"Mascota {data.pet_id} indexada correctamente en Postgres.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/buscar")
async def buscar_mascota(
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
    """Busca mascotas por similitud semántica en Postgres."""
    try:
        filters = {}
        if especie:
            filters["especie"] = especie.lower()
        if raza:
            filters["raza"] = raza.lower()
        if color:
            filters["color"] = color.lower()
        if estado:
            filters["estado"] = estado.lower()
        
        resultados = await v_service.search_similar_pets(
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
async def test_gemini(
    prompt: str = "Dame un saludo corto para un perro llamado Toby",
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Prueba de generación de contenido con gemini-2.5-flash."""
    try:
        response = await v_service.ai_client.models.generate_content(
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
async def test_embedding(
    texto: str = "Un perro labrador de color dorado",
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Prueba de vectorización con gemini-embedding-2."""
    try:
        vector = await v_service._get_embedding(texto)
        return {
            "status": "success",
            "modelo_usado": "gemini-embedding-2",
            "texto_original": texto,
            "dimensiones": len(vector),
            "vector_ejemplo": vector[:5],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))