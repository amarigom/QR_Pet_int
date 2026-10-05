export interface VeterinarianClient {
  id: string
  nombre: string
  email: string
  telefono: string | null
  mascotas_count: number
  pending_activation: boolean
}

export interface VeterinarianPet {
  id: string
  usuario_id: string
  nombre: string
  especie: string
  estado: string
  qr: {
    id: string
    codigo: string
    activo: boolean
    mascota_id: string | null
    created_at: string
    lote: string | null
  } | null
}

export interface VeterinarianQR {
  id: string
  codigo: string
  activo: boolean
  mascota_id: string | null
  mascota_nombre: string
  dueno_nombre: string
}

export interface VeterinarianScan {
  id: string
  qr_codigo: string
  pet_name: string
  created_at: string
  latitud: number | null
  longitud: number | null
  direccion_aproximada: string | null
}

export interface MedicalRecord {
  id: string
  veterinario_id: string
  mascota_id: string
  fecha_consulta: string
  created_at: string
  motivo_consulta: string
  diagnostico: string | null
  tratamiento: string | null
  peso_kg: number | null
  temperatura_c: number | null
  adjuntos: unknown[] | null
  vectorizada: boolean
}

export type AppointmentStatus = 'PROGRAMADO' | 'ATENDIDO' | 'CANCELADO'

export interface Appointment {
  id: string
  veterinario_id: string
  mascota_id: string
  dueno_id: string | null
  fecha_hora_inicio: string
  fecha_hora_fin: string
  tipo_servicio: string
  observaciones: string | null
  estado: AppointmentStatus
  recordatorio_enviado: boolean
  created_at: string
}

export interface VeterinarianDashboardData {
  clinic: {
    nombre_clinica: string
    logo_url: string | null
  } | null
  clients: VeterinarianClient[]
  available_clients: VeterinarianClient[]
  pets: VeterinarianPet[]
  available_pets: VeterinarianPet[]
  qrs: VeterinarianQR[]
  scans: VeterinarianScan[]
  medical_records: MedicalRecord[]
  appointments: Appointment[]
}

export interface VeterinarianClientCreated {
  id: string
  nombre: string
  email: string
  whatsapp_sent: boolean
  activation_url: string | null
  whatsapp_error?: string | null
  message: string
}

export interface VeterinarianClinicProfile {
  id: string
  user_id: string
  nombre_clinica: string
  matricula: string
  especialidad: string | null
  direccion_consultorio: string | null
  telefono_agenda: string | null
  logo_url: string | null
  activo: boolean
  created_at: string
}
