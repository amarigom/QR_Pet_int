"""
Servicio de Asistente IA Veterinario
Proporciona respuestas contextuales sobre cuidado de mascotas
"""
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.ai_provider import AIProvider
from app.repositories.medical_record_repository import MedicalRecordRepository
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.pet_repository import PetRepository
from app.core.exceptions import ResourceNotFoundException, ValidationException


class AIAssistantService:
    """
    Asistente IA para consultas veterinarias
    Proporciona recomendaciones personalizadas basadas en historial de mascota
    """

    def __init__(self, db: AsyncSession, ai_provider: AIProvider):
        self.db = db
        self.ai_provider = ai_provider
        self.record_repo = MedicalRecordRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.pet_repo = PetRepository(db)

    async def answer_pet_query(
        self,
        pet_id: uuid.UUID,
        question: str
    ) -> Dict[str, Any]:
        """
        Responde una pregunta sobre una mascota
        Usa contexto del historial médico y próximas citas
        
        Ejemplo de preguntas:
        - "¿Cómo debe presentarse mi gato para vacunación?"
        - "¿Qué debo hacer antes de la cirugía?"
        - "¿Cuáles son los síntomas de alergias?"
        """
        # Validar que la mascota existe
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Obtener contexto
        medical_history = await self.record_repo.get_by_pet_id(pet_id, limit=5)
        next_appointment = await self.appointment_repo.get_next_appointment(pet_id)

        # Construir prompt con contexto
        prompt = self._build_prompt(
            question=question,
            pet=pet,
            medical_history=medical_history,
            next_appointment=next_appointment
        )

        # Llamar IA
        response = await self.ai_provider.generate_response(
            prompt=prompt,
            temperature=0.7,
            max_tokens=500
        )

        # Registrar interacción (para análisis futuro)
        await self._log_interaction(pet_id, question, response)

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "question": question,
            "response": response,
            "timestamp": datetime.utcnow(),
            "has_next_appointment": next_appointment is not None
        }

    async def get_pre_appointment_advice(
        self,
        appointment_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Proporciona consejos específicos antes de una cita
        Basado en el tipo de consulta programada
        """
        appointment = await self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ResourceNotFoundException("Cita")

        pet = await self.pet_repo.get_by_id(appointment.pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        # Construir prompt específico para la cita
        prompt = self._build_appointment_prompt(
            pet=pet,
            appointment_type=appointment.tipo_consulta,
            clinic_name=appointment.veterinary_clinic.nombre if appointment.veterinary_clinic else "Clínica"
        )

        response = await self.ai_provider.generate_response(
            prompt=prompt,
            temperature=0.5,  # Menos creativo, más informativo
            max_tokens=600
        )

        return {
            "appointment_id": appointment_id,
            "pet_name": pet.nombre,
            "appointment_type": appointment.tipo_consulta,
            "appointment_date": appointment.fecha_programada,
            "advice": response,
            "timestamp": datetime.utcnow()
        }

    async def get_health_recommendations(
        self,
        pet_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Proporciona recomendaciones generales de salud para una mascota
        Basado en especie, edad, historial médico
        """
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        medical_history = await self.record_repo.get_by_pet_id(pet_id, limit=10)

        prompt = f"""
        Eres un asistente veterinario experto. Proporciona recomendaciones de salud 
        personalizadas para la siguiente mascota:
        
        Nombre: {pet.nombre}
        Especie: {pet.especie}
        Raza: {pet.raza or 'No especificada'}
        Edad aproximada: {pet.edad_aproximada or 'Desconocida'}
        
        Historial médico reciente:
        {self._format_medical_history(medical_history)}
        
        Por favor proporciona:
        1. Recomendaciones generales de salud
        2. Vacunaciones sugeridas
        3. Cuidados preventivos
        4. Señales de alerta a vigilar
        5. Próxima visita recomendada
        
        Sé amable, claro y específico para {pet.nombre}.
        """

        response = await self.ai_provider.generate_response(
            prompt=prompt,
            temperature=0.6,
            max_tokens=700
        )

        return {
            "pet_id": pet_id,
            "pet_name": pet.nombre,
            "recommendations": response,
            "timestamp": datetime.utcnow()
        }

    async def generate_treatment_summary(
        self,
        medical_record_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Genera un resumen inteligente de un tratamiento
        Para que el dueño entienda mejor qué ocurre
        """
        record = await self.record_repo.get_by_id(medical_record_id)
        if not record:
            raise ResourceNotFoundException("Registro médico")

        pet = await self.pet_repo.get_by_id(record.pet_id)
        if not pet:
            raise ResourceNotFoundException("Mascota")

        prompt = f"""
        Eres un asistente veterinario. Resume en lenguaje simple para el dueño 
        de una mascota lo siguiente:
        
        Tipo de consulta: {record.tipo}
        Diagnóstico: {record.diagnostico or 'No especificado'}
        Tratamiento: {record.tratamiento or 'No especificado'}
        Medicamentos: {self._format_medications(record.medicamentos) or 'Ninguno'}
        
        Proporciona:
        1. Explicación simple del diagnóstico
        2. Instrucciones claras del tratamiento
        3. Cuidados en casa
        4. Cuándo volver a consultar
        5. Preguntas frecuentes
        
        Usa un tono amable y comprensible para alguien sin conocimiento veterinario.
        """

        response = await self.ai_provider.generate_response(
            prompt=prompt,
            temperature=0.6,
            max_tokens=800
        )

        return {
            "medical_record_id": medical_record_id,
            "pet_name": pet.nombre,
            "summary": response,
            "original_type": record.tipo,
            "timestamp": datetime.utcnow()
        }

    async def validate_ai_provider(self) -> bool:
        """Valida que el proveedor IA funciona correctamente"""
        try:
            return await self.ai_provider.validate_connection()
        except Exception as e:
            raise ValidationException(f"AI provider connection failed: {str(e)}")

    def _build_prompt(
        self,
        question: str,
        pet: Any,
        medical_history: List[Any],
        next_appointment: Optional[Any]
    ) -> str:
        """Construye prompt contextualizado"""
        appointment_info = ""
        if next_appointment:
            appointment_info = f"""
            
            Próxima cita programada:
            - Tipo: {next_appointment.tipo_consulta}
            - Fecha: {next_appointment.fecha_programada.strftime('%d/%m/%Y %H:%M')}
            - Clínica: {next_appointment.veterinary_clinic.nombre if next_appointment.veterinary_clinic else 'Desconocida'}
            - Notas: {next_appointment.notas_previas or 'Ninguna'}
            """

        return f"""
        Eres un asistente veterinario experto, amable y profesional.
        
        CONTEXTO SOBRE LA MASCOTA:
        Nombre: {pet.nombre}
        Especie: {pet.especie}
        Raza: {pet.raza or 'No especificada'}
        Edad aproximada: {pet.edad_aproximada or 'Desconocida'}
        
        HISTORIAL MÉDICO RECIENTE:
        {self._format_medical_history(medical_history) or 'Sin registros previos'}
        
        {appointment_info}
        
        PREGUNTA DEL DUEÑO:
        {question}
        
        Por favor proporciona una respuesta clara, útil y basada en el contexto de {pet.nombre}.
        Si necesitas información adicional, pídela. Sé amable y accesible.
        """

    def _build_appointment_prompt(
        self,
        pet: Any,
        appointment_type: str,
        clinic_name: str
    ) -> str:
        """Construye prompt para consejos pre-cita"""
        return f"""
        Eres un asistente veterinario experto. Proporciona instrucciones claras 
        para preparar a una mascota para una cita específica.
        
        MASCOTA:
        Nombre: {pet.nombre}
        Especie: {pet.especie}
        
        TIPO DE CITA: {appointment_type}
        CLÍNICA: {clinic_name}
        
        Por favor proporciona:
        1. Preparación recomendada (ayuno, baño, etc)
        2. Qué traer a la cita
        3. Información a llevar (vacunas previas, medicamentos, etc)
        4. Duración estimada
        5. Qué esperar durante la cita
        
        Sé específico para una cita de {appointment_type}.
        """

    def _format_medical_history(self, records: List[Any]) -> str:
        """Formatea historial médico para el prompt"""
        if not records:
            return "Sin registros médicos previos"

        formatted = []
        for record in records:
            formatted.append(
                f"- {record.fecha_registro.strftime('%d/%m/%Y')}: {record.tipo} - {record.descripcion or 'Sin descripción'}"
            )
        return "\n".join(formatted)

    def _format_medications(self, medications_json: Optional[Dict]) -> str:
        """Formatea medicamentos para el prompt"""
        if not medications_json or "medicamentos" not in medications_json:
            return "Sin medicamentos"

        meds = medications_json.get("medicamentos", [])
        formatted = []
        for med in meds:
            formatted.append(f"- {med.get('nombre')}: {med.get('dosis')} cada {med.get('frecuencia')}")
        return "\n".join(formatted)

    async def _log_interaction(self, pet_id: uuid.UUID, question: str, response: str):
        """
        Registra interacción con IA para análisis posterior
        TODO: Crear tabla AIInteractionLog en BD
        """
        # Mock implementation
        print(f"[AI Interaction Log] Pet: {pet_id}, Q: {question[:50]}..., Response: {response[:50]}...")
