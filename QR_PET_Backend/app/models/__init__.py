# app/models/__init__.py
from .base import Base
from .user import User
from .pet import Pet
from .qr import QRCode
from .veterinary_clinic import VeterinaryClinic
from .medical_record import MedicalRecord
from .appointment import Appointment
from .vaccination_record import VaccinationRecord
from .treatment_progress import TreatmentProgress
from .veterinary_reminder import VeterinaryReminder

# Esto facilita importar todo desde un solo lugar: 
# from app.models import User, Pet, VeterinaryClinic, etc
__all__ = [
    "Base",
    "User",
    "Pet",
    "QRCode",
    "VeterinaryClinic",
    "MedicalRecord",
    "Appointment",
    "VaccinationRecord",
    "TreatmentProgress",
    "VeterinaryReminder",
]
