from pydantic import BaseModel
from typing import List
from app.schemas.pet import PetResponse # Usá tu esquema real de mascota

class DashboardSummary(BaseModel):
    total_pets: int
    active_qrs: int

class UserDashboardResponse(BaseModel):
    summary: DashboardSummary
    pets: List[PetResponse] # Array directo de mascotas

    class Config:
        from_attributes = True
        

