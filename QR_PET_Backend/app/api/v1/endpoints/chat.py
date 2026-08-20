from fastapi import APIRouter, Depends, HTTPException
from app.services.chroma_service import VectorStoreService
from app.schemas.chat import ChatQueryInput, ChatQueryResponse
from app.api.v1.dependencies import get_vector_store_service

router = APIRouter(prefix="/chatbot", tags=["Chatbot RAG"])

@router.post("/preguntar", response_model=ChatQueryResponse)
async def preguntar_al_chatbot(
    data: ChatQueryInput,
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    try:
        # Convertimos la lista de Pydantic a lista de dicts
        historial_dict = [m.model_dump() for m in data.historial] if data.historial else []

        resultado = v_service.responder_con_rag(
            pregunta=data.pregunta,
            historial=historial_dict,
            categoria=data.categoria,
            limit=data.limit
        )

        return ChatQueryResponse(
            status="success",
            respuesta=resultado["respuesta"],
            fuentes=resultado["fuentes"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en la consulta con memoria: {str(e)}"
        )