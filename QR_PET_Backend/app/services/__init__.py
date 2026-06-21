# Services module

from .veterinary_clinic_service import VeterinaryClinicService
from .medical_record_service import MedicalRecordService
from .appointment_service import AppointmentService
from .vaccination_service import VaccinationService
from .treatment_service import TreatmentService

__all__ = [
    "VeterinaryClinicService",
    "MedicalRecordService",
    "AppointmentService",
    "VaccinationService",
    "TreatmentService",
]
