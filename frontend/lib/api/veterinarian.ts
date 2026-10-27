import { fetchAPI } from './client'
import type {
  Appointment,
  AppointmentStatus,
  MedicalRecord,
  PaginatedMedicalRecords,
  VeterinarianDashboardData,
  VeterinarianClientCreated,
  VeterinarianClinicProfile,
  VeterinarianScannedPet,
} from '@/lib/types/veterinarian'

export interface CreateAppointment {
  mascota_id: string
  dueno_id: string
  fecha_hora_inicio: string
  fecha_hora_fin: string
  tipo_servicio: string
  observaciones?: string
}

export interface CreateMedicalRecord {
  mascota_id: string
  motivo_consulta: string
  diagnostico?: string | null
  tratamiento?: string | null
  peso_kg?: number | null
  temperatura_c?: number | null
}

export interface UpdateMedicalRecord {
  motivo_consulta: string
  diagnostico?: string | null
  tratamiento?: string | null
  peso_kg?: number | null
  temperatura_c?: number | null
}

export interface CreateVeterinarianClient {
  nombre: string
  email: string
  telefono: string
}

export const veterinarianApi = {
  getDashboard: () =>
    fetchAPI<VeterinarianDashboardData>('/dashboard/veterinario'),

  createClient: (data: CreateVeterinarianClient) =>
    fetchAPI<VeterinarianClientCreated>('/veterinario/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendClientActivation: (clientId: string) =>
    fetchAPI<VeterinarianClientCreated>(
      `/veterinario/clientes/${clientId}/reenviar-activacion`,
      { method: 'POST' },
    ),

  uploadClinicLogo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetchAPI<VeterinarianClinicProfile>(
      '/veterinario/perfil/logo',
      { method: 'PUT', body: formData },
    )
  },

  vectorizePendingHistories: () =>
    fetchAPI<{ procesadas: number; vectorizadas: number; pendientes: number }>(
      '/historias-clinicas/vectorizar',
      { method: 'POST' },
    ),

  getPetFromQr: (code: string) =>
    fetchAPI<{ pet: VeterinarianScannedPet }>(
      `/scans/veterinario/qr/${encodeURIComponent(code)}`,
    ),

  getPetMedicalRecords: (petId: string, page = 1, limit = 10) =>
    fetchAPI<PaginatedMedicalRecords>(
      `/historias-clinicas/mascota/${petId}/pagina?page=${page}&limit=${limit}`,
    ),

  createAppointment: (data: CreateAppointment) =>
    fetchAPI<Appointment>('/turnos/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAppointmentStatus: (id: string, status: AppointmentStatus) =>
    fetchAPI<Appointment>(`/turnos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevo_estado: status }),
    }),

  getWeeklyAppointments: (start: string, end: string) =>
    fetchAPI<Appointment[]>(
      `/turnos/agenda/semanal?inicio=${encodeURIComponent(start)}&fin=${encodeURIComponent(end)}`,
    ),

  deleteAppointment: (id: string) =>
    fetchAPI<Appointment>(`/turnos/${id}`, { method: 'DELETE' }),

  createMedicalRecord: (data: CreateMedicalRecord) =>
    fetchAPI<MedicalRecord>('/historias-clinicas/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMedicalRecord: (id: string, data: UpdateMedicalRecord) =>
    fetchAPI<MedicalRecord>(`/historias-clinicas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
