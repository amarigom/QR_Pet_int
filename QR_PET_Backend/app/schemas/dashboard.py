from pydantic import BaseModel
from typing import List
from typing import Any, Dict, List

from app.schemas.pet import PetResponse # Usá tu esquema real de mascota

class DashboardSummary(BaseModel):
    total_pets: int
    active_qrs: int
class Config:
        from_attributes = True
class UserDashboardResponse(BaseModel):
    summary: DashboardSummary
    pets: List[PetResponse] 
    recent_scans: List[Any]

    class Config:
        from_attributes = True
        

