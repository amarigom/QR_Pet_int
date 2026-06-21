"""
Endpoints para Asistente IA Veterinario
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.ai_assistant_service import AIAssistantService
from app.ai.ai_provider import AIProviderFactory
from app.core.config import OPENAI_API_KEY, AI_PROVIDER
from app.core.exceptions import ResourceNotFoundException, ValidationException


router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])


class PetQueryRequest(BaseModel):
    """Request para pregunta sobre mascota"""
    question: str
    
    class Config:
        example = {
            "question": "¿Cómo preparo a mi gato para la vacunación?"
        }


class HealthRecommendationRequest(BaseModel):
    """Request para recomendaciones de salud"""
    pass


def get_ai_service(db: AsyncSession) -> AIAssistantService:
    """Obtiene el servicio de IA"""
    # Crear proveedor según configuración
    if AI_PROVIDER == "mock":
        ai_provider = AIProviderFactory.create("mock")
    elif AI_PROVIDER == "openai":
        if not OPENAI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key not configured"
            )
        ai_provider = AIProviderFactory.create("openai", api_key=OPENAI_API_KEY)
    else:
        ai_provider = AIProviderFactory.create("mock")
    
    return AIAssistantService(db, ai_provider)


@router.post(
    "/pet/{pet_id}/query",
    summary="Consulta sobre mascota",
    description="Realiza una consulta sobre una mascota usando IA"
)
async def query_pet_ai(
    pet_id: uuid.UUID,
    request: PetQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Realiza una consulta sobre una mascota"""
    try:
        service = get_ai_service(db)
        result = await service.answer_pet_query(
            pet_id=pet_id,
            question=request.question
        )
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/appointment/{appointment_id}/advice",
    summary="Consejos pre-cita",
    description="Obtiene consejos para prepararse para una cita"
)
async def get_appointment_advice(
    appointment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene consejos pre-cita"""
    try:
        service = get_ai_service(db)
        result = await service.get_pre_appointment_advice(appointment_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/pet/{pet_id}/recommendations",
    summary="Recomendaciones de salud",
    description="Obtiene recomendaciones personalizadas de salud para una mascota"
)
async def get_health_recommendations(
    pet_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene recomendaciones de salud"""
    try:
        service = get_ai_service(db)
        result = await service.get_health_recommendations(pet_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/medical-record/{record_id}/summary",
    summary="Resumen de tratamiento",
    description="Genera un resumen en lenguaje simple de un tratamiento"
)
async def get_treatment_summary(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene resumen de un tratamiento"""
    try:
        service = get_ai_service(db)
        result = await service.generate_treatment_summary(record_id)
        return result
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    "/health-check",
    summary="Verificar IA",
    description="Verifica que el proveedor IA funciona correctamente"
)
async def health_check(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Verifica la conexión con el proveedor IA"""
    try:
        service = get_ai_service(db)
        is_valid = await service.validate_ai_provider()
        return {
            "status": "ok" if is_valid else "error",
            "provider": AI_PROVIDER,
            "connected": is_valid
        }
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
