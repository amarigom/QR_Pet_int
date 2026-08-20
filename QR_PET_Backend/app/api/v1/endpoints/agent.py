from fastapi import APIRouter, Query
from app.services.news_agent import NewsAgent
from app.services.info_agent import InfoAgent
from app.services.groq_agent import GroqAgent

router = APIRouter()
agente = GroqAgent()

@router.get("/summary")
async def get_agent_summary(lat: float = Query(..., example=-37.3288), lng: float = Query(..., example=-59.1370)):
    alerts = await NewsAgent.get_rabies_alerts()
    veterinaries = await InfoAgent.get_nearby_veterinaries(lat, lng)

    return {
        "status": "success",
        "user_location": {"lat": lat, "lng": lng},
        "alertas_rabia": alerts,
        "veterinarias": veterinaries
    }