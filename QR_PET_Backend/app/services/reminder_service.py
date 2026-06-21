"""
Servicio de Recordatorios Veterinarios
Maneja creación, envío y seguimiento de recordatorios automáticos
"""
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.veterinary_reminder_repository import VeterinaryReminderRepository
from app.repositories.vaccination_record_repository import VaccinationRecordRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.medical_record_repository import MedicalRecordRepository
from app.repositories.pet_repository import PetRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException
from app.schemas.veterinary_reminder import (
    VeterinaryReminderCreate,
    VeterinaryReminderResponse,
)


class ReminderService:
    """Servicio para gestionar recordatorios automáticos"""

    def __init__(self, db: AsyncSession, email_service=None):
        """
        email_service: Inyección de dependencia para enviar emails
        Puede ser mock para testing
        """
        self.db = db
        self.reminder_repo = VeterinaryReminderRepository(db)
        self.vaccine_repo = VaccinationRecordRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.record_repo = MedicalRecordRepository(db)
        self.pet_repo = PetRepository(db)
        self.email_service = email_service

    async def create_reminder(
        self,
        pet_id: uuid.UUID,
        owner_email: str,
        veterinary_email: Optional[str] = None,
        reminder_type: str = "vacunación_proxima",
        fecha_programada: Optional[datetime] = None,
        asunto: Optional[str] = None,
        contenido: Optional[str] = None
    ) -> VeterinaryReminderResponse:
        """Crea un recordatorio manualmente"""
        # Validar que la mascota existe
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Usar fecha actual + 1 día si no se especifica
        if not fecha_programada:
            fecha_programada = datetime.utcnow() + timedelta(days=1)

        # Generar asunto si no se proporciona
        if not asunto:
            asunto = self._generate_subject(reminder_type, pet.nombre)

        # Generar contenido si no se proporciona
        if not contenido:
            contenido = self._generate_content(reminder_type, pet)

        reminder = await self.reminder_repo.create(
            pet_id=pet_id,
            owner_email=owner_email,
            veterinary_email=veterinary_email,
            tipo=reminder_type,
            fecha_programada=fecha_programada,
            asunto=asunto,
            contenido=contenido,
            enviado=False,
            intentos_envio=0
        )
        await self.db.commit()

        return VeterinaryReminderResponse.model_validate(reminder)

    async def schedule_upcoming_vaccines_reminders(
        self,
        pet_id: uuid.UUID,
        days_ahead: int = 7
    ) -> List[VeterinaryReminderResponse]:
        """
        Crea recordatorios para vacunas próximas a vencer
        Se llama cuando se registra una mascota en una clínica
        """
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Obtener próximas vacunas
        upcoming_vaccines = await self.vaccine_repo.get_upcoming_vaccines(
            pet_id,
            days=days_ahead
        )

        reminders = []

        for vaccine in upcoming_vaccines:
            # Crear recordatorio 7 días antes de la próxima dosis
            if vaccine.proxima_dosis:
                fecha_recordatorio = vaccine.proxima_dosis - timedelta(days=7)
                
                # Solo si aún no ha pasado
                if fecha_recordatorio > datetime.utcnow():
                    reminder = await self.create_reminder(
                        pet_id=pet_id,
                        owner_email=pet.owner.email,
                        reminder_type="vacunación_proxima",
                        fecha_programada=fecha_recordatorio,
                        asunto=f"Próxima vacunación de {pet.nombre}: {vaccine.nombre_vacuna}",
                        contenido=self._generate_vaccine_reminder(pet, vaccine)
                    )
                    reminders.append(reminder)

        return reminders

    async def schedule_appointment_reminders(
        self,
        appointment_id: uuid.UUID
    ) -> VeterinaryReminderResponse:
        """Crea recordatorio para una cita (24 horas antes)"""
        appointment = await self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ResourceNotFoundException("Cita")

        pet = await self.pet_repo.get_by_id(appointment.pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Recordatorio 24 horas antes
        fecha_recordatorio = appointment.fecha_programada - timedelta(days=1)

        reminder = await self.create_reminder(
            pet_id=appointment.pet_id,
            owner_email=pet.owner.email,
            veterinary_email=appointment.veterinary_clinic.email if appointment.veterinary_clinic else None,
            reminder_type="turno_recordatorio",
            fecha_programada=fecha_recordatorio,
            asunto=f"Recordatorio: Cita para {pet.nombre}",
            contenido=self._generate_appointment_reminder(pet, appointment)
        )

        return reminder

    async def get_pending_reminders(self) -> List[VeterinaryReminderResponse]:
        """Obtiene recordatorios pendientes de enviar (usado por scheduler)"""
        reminders = await self.reminder_repo.get_pending_to_send()
        return [VeterinaryReminderResponse.model_validate(r) for r in reminders]

    async def send_reminder(
        self,
        reminder_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Envía un recordatorio
        Actualiza el estado y registra intentos
        """
        reminder = await self.reminder_repo.get_by_id(reminder_id)
        if not reminder:
            raise ResourceNotFoundException("Recordatorio")

        try:
            # Llamar servicio de email
            if self.email_service:
                await self.email_service.send_email(
                    to_email=reminder.owner_email,
                    subject=reminder.asunto,
                    body=reminder.contenido,
                    cc=reminder.veterinary_email
                )
            else:
                # Mock: solo loguear
                print(f"[MOCK EMAIL] To: {reminder.owner_email}, Subject: {reminder.asunto}")

            # Marcar como enviado
            reminder.enviado = True
            reminder.fecha_enviado = datetime.utcnow()
            reminder.intentos_envio += 1
            await self.db.commit()

            return {
                "success": True,
                "reminder_id": reminder_id,
                "sent_to": reminder.owner_email,
                "message": "Recordatorio enviado exitosamente"
            }

        except Exception as e:
            # Registrar error
            reminder.intentos_envio += 1
            reminder.error_mensaje = str(e)
            await self.db.commit()

            return {
                "success": False,
                "reminder_id": reminder_id,
                "error": str(e),
                "attempts": reminder.intentos_envio,
                "message": "Error al enviar recordatorio"
            }

    async def send_all_pending(self) -> Dict[str, Any]:
        """
        Envía todos los recordatorios pendientes
        Se ejecuta por el scheduled job
        """
        pending = await self.get_pending_reminders()

        sent = 0
        failed = 0

        for reminder in pending:
            result = await self.send_reminder(reminder.id)
            if result["success"]:
                sent += 1
            else:
                failed += 1

        return {
            "total": len(pending),
            "sent": sent,
            "failed": failed,
            "timestamp": datetime.utcnow()
        }

    async def get_pet_reminders(
        self,
        pet_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Obtiene todos los recordatorios de una mascota"""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        reminders = await self.reminder_repo.get_by_pet_id(pet_id)

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "reminders": [VeterinaryReminderResponse.model_validate(r) for r in reminders],
            "total": len(reminders),
            "sent": sum(1 for r in reminders if r.enviado),
            "pending": sum(1 for r in reminders if not r.enviado)
        }

    def _generate_subject(self, reminder_type: str, pet_name: str) -> str:
        """Genera asunto del recordatorio según tipo"""
        subjects = {
            "vacunación_proxima": f"Próxima vacunación de {pet_name}",
            "turno_recordatorio": f"Recordatorio de cita para {pet_name}",
            "estudio_pendiente": f"Estudio pendiente para {pet_name}",
            "tratamiento_seguimiento": f"Seguimiento de tratamiento para {pet_name}"
        }
        return subjects.get(reminder_type, f"Recordatorio de {pet_name}")

    def _generate_content(self, reminder_type: str, pet: Any) -> str:
        """Genera contenido del recordatorio"""
        return f"""
        Hola,
        
        Este es un recordatorio automático sobre {pet.nombre}.
        
        Tipo: {reminder_type}
        Mascota: {pet.nombre} ({pet.especie})
        
        Por favor, contáctate con tu veterinario si tienes preguntas.
        
        Saludos,
        Sistema de Recordatorios QR Pet
        """

    def _generate_vaccine_reminder(self, pet: Any, vaccine: Any) -> str:
        """Genera contenido específico para recordatorio de vacunación"""
        return f"""
        Hola,
        
        Te recordamos que {pet.nombre} necesita la vacuna {vaccine.nombre_vacuna}.
        
        Fecha programada: {vaccine.proxima_dosis.strftime('%d/%m/%Y')}
        
        Por favor, contáctate con tu veterinario para agendar la cita.
        
        Saludos,
        Sistema de Recordatorios QR Pet
        """

    def _generate_appointment_reminder(self, pet: Any, appointment: Any) -> str:
        """Genera contenido específico para recordatorio de cita"""
        return f"""
        Hola,
        
        Te recordamos que tienes una cita agendada para {pet.nombre}.
        
        Detalles:
        - Mascota: {pet.nombre}
        - Tipo: {appointment.tipo_consulta}
        - Fecha: {appointment.fecha_programada.strftime('%d/%m/%Y %H:%M')}
        - Clínica: {appointment.veterinary_clinic.nombre if appointment.veterinary_clinic else 'Por confirmar'}
        
        {f'Notas: {appointment.notas_previas}' if appointment.notas_previas else ''}
        
        Por favor, llegar 10 minutos antes.
        
        Saludos,
        Sistema de Recordatorios QR Pet
        """

    async def get_statistics(self) -> Dict[str, Any]:
        """Obtiene estadísticas de recordatorios"""
        total_pending = await self.reminder_repo.count_pending()
        sent_today = await self.reminder_repo.count_sent_today()

        return {
            "pending_count": total_pending,
            "sent_today": sent_today,
            "timestamp": datetime.utcnow()
        }
