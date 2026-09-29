// lib/api/turnos.ts
import { fetchAPI } from '@/lib/api/client'

export interface TurnoCreate {
  mascota_id: string
  fecha: string // Formato YYYY-MM-DDTHH:mm:ss o ISO
  motivo: string
}

export interface TurnoUpdateEstado {
  estado: 'PROGRAMADO' | 'ATENDIDO' | 'CANCELADO'
}

export interface TurnoResponse {
  id: string
  veterinario_id: string
  mascota_id: string
  fecha: string
  motivo: string
  estado: string
  created_at: string
}

export const turnosApi = {
  /**
   * Agenda un nuevo turno asociándolo al veterinario autenticado.
   * Endpoint: POST /api/v1/turnos/
   */
  async agendarTurno(data: TurnoCreate): Promise<TurnoResponse> {
    return fetchAPI<TurnoResponse>('/turnos/', {
      method: 'POST',
      body: JSON.stringify(data), // 👈 Cumple estrictamente con 'BodyInit' (string)
    })
  },

  /**
   * Recupera los turnos del veterinario filtrados por día.
   * Endpoint: GET /api/v1/turnos/agenda?fecha=YYYY-MM-DD
   */
  async obtenerAgendaDia(fecha: string): Promise<TurnoResponse[]> {
    return fetchAPI<TurnoResponse[]>(`/turnos/agenda?fecha=${fecha}`, {
      method: 'GET',
    })
  },

  /**
   * Cambia el estado de un turno (PROGRAMADO -> ATENDIDO / CANCELADO).
   * Endpoint: PATCH /api/v1/turnos/{turno_id}/estado
   */
  async cambiarEstadoTurno(turnoId: string, payload: TurnoUpdateEstado): Promise<TurnoResponse> {
    return fetchAPI<TurnoResponse>(`/turnos/${turnoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(payload), // 👈 Cumple estrictamente con 'BodyInit' (string)
    })
  },
}