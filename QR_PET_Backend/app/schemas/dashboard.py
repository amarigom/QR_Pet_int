from pydantic import BaseModel
from typing import List
from typing import Any, Dict, List

from app.schemas.pet import PetResponse # Usá tu esquema real de mascota
from app.schemas.veterinario import VeterinarianClinicBrand

class DashboardSummary(BaseModel):
    total_pets: int
    active_qrs: int
class Config:
        from_attributes = True
class UserDashboardResponse(BaseModel):
    summary: DashboardSummary
    pets: List[PetResponse] 
    recent_scans: List[Any]
    veterinary_brands: List[VeterinarianClinicBrand] = []

    class Config:
        from_attributes = True
        
