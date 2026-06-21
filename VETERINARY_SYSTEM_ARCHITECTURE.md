# Sistema Veterinario - Plan Arquitectónico

## 1. VISIÓN GENERAL

Crear un sistema veterinario que permita:
- Veterinarios gestionar mascotas de su clínica
- Dueños registrar mascotas escaneando QR
- Sistema automático de recordatorios y chatbot IA
- Historial clínico completo y tratamientos
- Asignación de turnos

## 2. NUEVOS ROLES

```
SUPERADMIN → ADMIN_GENERAL → ADMIN → VETERINARIO → USER
|                                          |
|                                    Genera QR de clínica
|                                    Gestiona mascotas
|                                    Accede a historial clínico
|
└─→ Genera QR iniciales
    Administra veterinarias
```

## 3. NUEVOS MODELOS

### 3.1 Veterinary Clinic
```python
class VeterinaryClinic:
    id: UUID
    nombre: str
    email: str
    telefono: str
    direccion: str
    ubicacion: Punto GPS
    admin_id: UUID (FK User)  # Admin que creó la clínica
    created_at: datetime
```

### 3.2 Veterinarian (Usuario con rol VETERINARIO)
```python
# Usar modelo User existente con rol="veterinario"
# Agregar:
veterinary_clinic_id: UUID (FK VeterinaryClinic)
especialidades: List[str]  # ["cirugía", "dermatología", etc]
licencia_profesional: str
```

### 3.3 Medical Record (Historial Clínico)
```python
class MedicalRecord:
    id: UUID
    pet_id: UUID (FK Pet)
    veterinarian_id: UUID (FK User/Veterinarian)
    tipo: str  # "vacunación", "consulta", "cirugía", etc
    descripcion: str
    fecha: datetime
    diagnostico: Optional[str]
    tratamiento: Optional[str]
    medicamentos: List[str]
    archivo_adjunto: Optional[str]  # URL en blob
    created_at: datetime
```

### 3.4 Appointment (Turno)
```python
class Appointment:
    id: UUID
    pet_id: UUID (FK Pet)
    veterinary_clinic_id: UUID (FK VeterinaryClinic)
    veterinarian_id: Optional[UUID] (FK User/Veterinarian)
    tipo_consulta: str  # "vacunación", "chequeo", etc
    fecha_programada: datetime
    estado: str  # "pendiente", "confirmado", "completado", "cancelado"
    notas_previas: str
    created_at: datetime
    updated_at: datetime
```

### 3.5 Vaccination Record
```python
class VaccinationRecord:
    id: UUID
    medical_record_id: UUID (FK MedicalRecord)
    nombre_vacuna: str
    fecha_aplicacion: datetime
    proxima_dosis: Optional[datetime]
    veterinario: str
```

### 3.6 Treatment Progress
```python
class TreatmentProgress:
    id: UUID
    medical_record_id: UUID (FK MedicalRecord)
    fecha: datetime
    estado: str  # "iniciado", "en_progreso", "completado"
    descripcion: str
    foto_evidencia: Optional[str]
    veterinarian_id: UUID (FK User/Veterinarian)
```

### 3.7 Veterinary Reminder
```python
class VeterinaryReminder:
    id: UUID
    pet_id: UUID (FK Pet)
    tipo: str  # "vacunación_proxima", "estudio_pendiente", "turno_recordatorio"
    fecha_programada: datetime
    enviado: bool
    owner_email: str
    veterinary_email: str
    contenido: str
    created_at: datetime
```

### 3.8 Clinic QR Assignment
```python
class ClinicQRAssignment:
    id: UUID
    qr_codigo: str (FK QRCode.codigo)
    veterinary_clinic_id: UUID (FK VeterinaryClinic)
    fecha_asignacion: datetime
    disponible: bool  # True = sin usar, False = vinculado a mascota
```

## 4. FLUJOS DE NEGOCIO

### 4.1 Flujo: Veterinario carga mascota

```
1. Veterinario inicia sesión (rol=VETERINARIO)
2. Accede a "Cargar Mascota"
3. Selecciona QR de su clínica (de los disponibles)
4. Ingresa datos mascota
5. Opción A: Ingresa datos dueño O
   Opción B: Espera que el dueño escanee QR
6. Si Opción B:
   - QR queda "pendiente de vinculación"
   - Dueño escanea → ve formulario simplificado
   - Dueño ingresa sus datos
   - Sistema vincula automáticamente
7. Se crea: Pet + MedicalRecord inicial (vacío)
```

### 4.2 Flujo: Dueño carga mascota (escaneando QR)

```
1. Dueño escanea QR
2. Sistema verifica: ¿QR vinculado a clínica?
3. Si sí: Muestra QR details (clínica, opciones)
4. Dueño completa:
   - Datos mascota
   - Sus datos
   - Acepta términos
5. Sistema crea: Pet + MedicalRecord
6. Vincula a clínica
7. Notificación a veterinario de la clínica
```

### 4.3 Flujo: Recordatorio automático

```
CADA DÍA (scheduled job):
1. Buscar mascotas con próximas vacunaciones
2. Si fecha_proxima_vacuna <= HOY + 7 días
3. Enviar email a dueño + veterinario
4. Registrar Reminder
5. Si no respondieron, re-enviar cada 2 días
```

### 4.4 Flujo: Chatbot IA

```
Dueño: "¿Cómo debe presentarse mi gato para vacunación?"

Sistema:
1. Extrae próxima cita del pet_id
2. Obtiene tipo de consulta
3. Llama a IA con contexto:
   - Tipo de consulta
   - Historial clínico previo
   - Recomendaciones del veterinario
4. IA genera respuesta personalizada
5. Envía a dueño vía email/chat

Respuesta ejemplo:
"Tu gato debe llegar en ayunas desde las 22:00 del día anterior.
Trae su cartilla de vacunación y cualquier medicamento que esté tomando.
Duración estimada: 15 minutos. Datos de la clínica: ..."
```

## 5. PATRONES ARQUITECTÓNICOS

### 5.1 Patrón Repository-Service (Sin dependencias circulares)

```
LAYER 1: MODELS (Database entities)
  ├─ User
  ├─ VeterinaryClinic
  ├─ Pet
  ├─ MedicalRecord
  ├─ Appointment
  ├─ VaccinationRecord
  ├─ TreatmentProgress
  ├─ VeterinaryReminder
  └─ ClinicQRAssignment

LAYER 2: REPOSITORIES (Data access)
  ├─ VeterinaryClinicRepository
  ├─ MedicalRecordRepository
  ├─ AppointmentRepository
  ├─ VaccinationRecordRepository
  ├─ TreatmentProgressRepository
  ├─ VeterinaryReminderRepository
  └─ ClinicQRAssignmentRepository
  
  Cada repository solo interactúa con su modelo
  NO conoce a otros repositories

LAYER 3: SERVICES (Business logic)
  ├─ VeterinaryClinicService
  │  └─ Usa: VeterinaryClinicRepository
  │
  ├─ VeterinaryService
  │  └─ Usa: VeterinaryClinicRepository (para verificar clínica del vet)
  │
  ├─ MedicalRecordService
  │  └─ Usa: MedicalRecordRepository
  │
  ├─ AppointmentService
  │  ├─ Usa: AppointmentRepository
  │  ├─ Usa: VeterinaryClinicRepository (para obtener veterinarios)
  │  └─ Usa: PetRepository (para obtener datos mascota)
  │
  ├─ VaccinationService
  │  ├─ Usa: VaccinationRecordRepository
  │  └─ Usa: MedicalRecordRepository
  │
  ├─ ReminderService
  │  ├─ Usa: VeterinaryReminderRepository
  │  └─ Usa: MedicalRecordRepository (para obtener próximas vacunas)
  │
  ├─ AIAssistantService (Chatbot)
  │  ├─ Usa: MedicalRecordRepository (para contexto)
  │  ├─ Usa: AppointmentRepository (para obtener tipo consulta)
  │  └─ Llama a API externa (OpenAI, Claude, etc)
  │
  └─ PetVeterinaryLinkService (FACTORY PATTERN)
     ├─ Orquesta: PetService + VeterinaryClinicService
     ├─ Maneja: "¿Carga vet o carga owner?"
     └─ Evita: Duplicados

LAYER 4: APIS (Endpoints)
  ├─ /api/v1/veterinary/clinics/*
  ├─ /api/v1/veterinary/medical-records/*
  ├─ /api/v1/veterinary/appointments/*
  ├─ /api/v1/veterinary/vaccinations/*
  ├─ /api/v1/veterinary/treatments/*
  ├─ /api/v1/veterinary/reminders/*
  └─ /api/v1/veterinary/ai-assistant/*

LAYER 5: SCHEDULED JOBS
  ├─ reminder_job.py (cada día)
  └─ cleanup_job.py (cada semana)
```

### 5.2 Factory Pattern (Evitar duplicados)

```python
class PetVeterinaryLinkFactory:
    """
    Factory que maneja la lógica de "¿quién carga la mascota?"
    Evita duplicados y dependencias circulares
    """
    
    def create_pet_by_veterinarian(
        self, 
        clinic_id: UUID, 
        qr_codigo: str, 
        pet_data: PetCreate, 
        owner_data: OwnerCreate
    ) -> Pet:
        """Vet carga mascota + dueño"""
        # 1. Verificar que el QR pertenece a la clínica
        # 2. Verificar que el QR no está usado
        # 3. Buscar si el owner ya existe
        # 4. Si existe: reusar; Si no: crear
        # 5. Crear Pet
        # 6. Marcar QR como usado
        # 7. Crear MedicalRecord vacío
        
    def create_pet_by_owner_scan(
        self, 
        qr_codigo: str, 
        pet_data: PetCreate, 
        owner_data: OwnerCreate
    ) -> Pet:
        """Owner escanea QR y carga mascota"""
        # 1. Verificar QR
        # 2. Obtener clinic_id del QR
        # 3. Mismos pasos que veterinario
        # 4. Notificar a veterinario
```

### 5.3 Composite Pattern (Historial clínico)

```python
class MedicalRecordComposite:
    """
    Agrupa: Consultas + Vacunaciones + Tratamientos
    Como un árbol de información
    """
    
    def get_full_history(pet_id: UUID) -> MedicalHistoryDTO:
        consultas = MedicalRecordRepository.find_by_type("consulta")
        vacunas = VaccinationRecordRepository.find_by_pet(pet_id)
        tratamientos = TreatmentProgressRepository.find_by_pet(pet_id)
        
        return MedicalHistoryDTO(
            consultas=consultas,
            vacunas=vacunas,
            tratamientos=tratamientos,
            proximo_recordatorio=calcular_proximo_recordatorio()
        )
```

## 6. EVITAR DEPENDENCIAS CIRCULARES

### ❌ MAL
```python
# service_a.py
from app.services.service_b import ServiceB

class ServiceA:
    def method_a(self):
        ServiceB().method_b()  # ServiceA → ServiceB

# service_b.py
from app.services.service_a import ServiceA

class ServiceB:
    def method_b(self):
        ServiceA().method_a()  # ServiceB → ServiceA
        # ¡CIRCULAR!
```

### ✅ BIEN
```python
# OPCIÓN 1: EVENT-DRIVEN (recomendado)
# event_bus.py
class EventBus:
    handlers = {}
    
    @staticmethod
    def subscribe(event_type, handler):
        EventBus.handlers[event_type] = handler
    
    @staticmethod
    def publish(event):
        if event.type in EventBus.handlers:
            EventBus.handlers[event.type](event)

# service_a.py
from app.events import EventBus, MedicalRecordCreatedEvent

class ServiceA:
    def create_record(self, data):
        record = self.repository.create(data)
        EventBus.publish(MedicalRecordCreatedEvent(record))
        return record

# service_b.py
from app.events import EventBus, MedicalRecordCreatedEvent

class ServiceB:
    def __init__(self):
        EventBus.subscribe(MedicalRecordCreatedEvent, self.on_record_created)
    
    def on_record_created(self, event):
        self.send_reminder(event.record)

# OPCIÓN 2: DEPENDENCY INJECTION
class ServiceA:
    def __init__(self, reminder_service: ReminderService):
        self.reminder_service = reminder_service
    
    def create_record(self, data):
        record = self.repository.create(data)
        self.reminder_service.schedule_reminder(record)
        return record
```

## 7. INTEGRACIÓN CON IA

### 7.1 AI Provider (Abstracción)

```python
class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, context: dict) -> str:
        pass

class OpenAIProvider(AIProvider):
    async def generate_response(self, prompt, context):
        # Implementación OpenAI
        pass

class ClaudeProvider(AIProvider):
    async def generate_response(self, prompt, context):
        # Implementación Claude
        pass
```

### 7.2 AI Assistant Service

```python
class AIAssistantService:
    def __init__(self, ai_provider: AIProvider):
        self.ai_provider = ai_provider
    
    async def answer_pet_query(self, pet_id: UUID, question: str) -> str:
        # 1. Obtener contexto del pet
        medical_history = await self.medical_record_repo.get_full_history(pet_id)
        upcoming_appointment = await self.appointment_repo.get_next(pet_id)
        
        # 2. Construir prompt
        prompt = f"""
        Eres un asistente veterinario amable.
        
        Mascota: {medical_history.pet_name}
        Tipo: {medical_history.pet_type}
        Próxima cita: {upcoming_appointment.tipo_consulta}
        Último registro: {medical_history.last_record}
        
        Pregunta del dueño: {question}
        
        Responde de forma clara, breve y amable.
        """
        
        # 3. Llamar IA
        response = await self.ai_provider.generate_response(prompt, context={
            'medical_history': medical_history,
            'upcoming_appointment': upcoming_appointment
        })
        
        # 4. Registrar interacción
        await self.ai_log_repo.create(pet_id, question, response)
        
        return response
```

## 8. IMPLEMENTACIÓN STEP-BY-STEP

### Phase 1: Modelos y Repositorios
1. Crear nuevos modelos (VeterinaryClinic, MedicalRecord, etc)
2. Crear repositorios para cada modelo

### Phase 2: Servicios Core
3. VeterinaryClinicService
4. MedicalRecordService
5. AppointmentService

### Phase 3: Factory y Orquestación
6. PetVeterinaryLinkFactory
7. VeterinaryService (que usa factory)

### Phase 4: Características Avanzadas
8. ReminderService + Scheduled Jobs
9. AIAssistantService
10. APIs y Endpoints

### Phase 5: Frontend
11. UI para veterinarios
12. Chatbot widget

## 9. SEGURIDAD Y PERMISOS

```python
# En cada endpoint, validar:
@router.post("/veterinary/clinics/{clinic_id}/medical-records")
async def create_record(
    clinic_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. ¿El usuario es veterinario?
    if current_user.rol != UserRole.VETERINARIO:
        raise HTTPException(403, "Solo veterinarios")
    
    # 2. ¿La clínica es del veterinario?
    clinic = await clinic_repo.get(clinic_id)
    if clinic.veterinarian_id != current_user.id:
        raise HTTPException(403, "No tienes acceso a esta clínica")
    
    # 3. Proceder con la creación
```

---

Esta arquitectura permite:
✅ Evitar dependencias circulares (Event-driven + DI)
✅ Reutilizar código (Factory Pattern)
✅ Escalar fácilmente (Composite Pattern)
✅ Agregar IA sin romper la arquitectura (Provider Pattern)
✅ Seguridad por roles y permisos
