import { fetchAPI } from './client'
import type {
  Appointment,
  AppointmentStatus,
  MedicalRecord,
  VeterinarianDashboardData,
  VeterinarianClientCreated,
  VeterinarianClinicProfile,
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
  diagnostico?: string
  tratamiento?: string
  peso_kg?: number
  temperatura_c?: number
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
}
