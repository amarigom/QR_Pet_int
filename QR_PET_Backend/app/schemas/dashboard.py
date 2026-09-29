from pydantic import BaseModel
from typing import List
from typing import Any, Dict, List

from app.schemas.pet import PetResponse # Usá tu esquema real de mascota

class DashboardSummary(BaseModel):
    total_pets: int
    active_qrs: int
class Config:
        from_attributes = True
class VeterinarioStats(BaseModel):
    turnos_hoy: int = 0
    turnos_proximos: int = 0
    historias_clinicas: int = 0
    mascotas_activas: int = 0
    qrs_asignados: int = 0
    documentos_cargados: int = 0

class ConsultaPorDia(BaseModel):
    date: str
    count: int

class VeterinarioDashboardResponse(BaseModel):
    stats: VeterinarioStats
    consultas_por_dia: List[ConsultaPorDia] = []

class UserDashboardResponse(BaseModel):
    summary: DashboardSummary
    pets: List[PetResponse] 
    recent_scans: List[Any]

    class Config:
        from_attributes = True
        

