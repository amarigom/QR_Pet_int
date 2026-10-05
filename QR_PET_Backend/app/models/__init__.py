# app/models/__init__.py
from .base import Base
from .user import User
from .pet import Pet
from .qr import QRCode

from app.models.pet_vector import PetVector
from app.models.veterinario import PerfilVeterinario
from app.models.historia_clinica import HistoriaClinica  # 👈 Nuevo
from app.models.turno import Turno
from app.models.veterinario_cliente import veterinario_clientes
from app.models.conocimiento import KnowledgeVector


# Esto facilita importar todo desde un solo lugar: 
# from app.models import User, Pet
__all__ = ["Base", "User", "Pet", "QRCode","PetVector","PerfilVeterinario","HistoriaClinica", "Turno", "veterinario_clientes", "KnowledgeVector"]