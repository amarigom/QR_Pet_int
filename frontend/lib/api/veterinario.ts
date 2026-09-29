import { fetchAPI } from '@/lib/api/client'

export interface Turno { id: string; mascota_id: string; dueno_id?: string | null; fecha_hora_inicio: string; fecha_hora_fin: string; tipo_servicio: string; observaciones?: string | null; estado: string }
export interface HistoriaClinica { id: string; mascota_id: string; veterinario_id: string; motivo_consulta: string; diagnostico?: string | null; tratamiento?: string | null; peso_kg?: number | null; temperatura_c?: number | null; adjuntos?: Array<Record<string, unknown> | string>; fecha_consulta: string; created_at: string }
export interface HistoriaCreate { mascota_id: string; motivo_consulta: string; diagnostico?: string; tratamiento?: string; peso_kg?: number; temperatura_c?: number }

export const veterinarioApi = {
  crearTurno: (payload: { mascota_id: string; dueno_id?: string; fecha_hora_inicio: string; fecha_hora_fin: string; tipo_servicio: string; observaciones?: string }) => fetchAPI<Turno>('/veterinario/turnos', { method: 'POST', body: JSON.stringify(payload) }),
  agenda: (fecha: string) => fetchAPI<Turno[]>(`/veterinario/turnos/agenda?fecha=${encodeURIComponent(fecha)}`),
  cambiarEstado: (id: string, nuevo_estado: string, observaciones?: string) => fetchAPI<Turno>(`/veterinario/turnos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ nuevo_estado, observaciones }) }),
  historias: (mascotaId?: string) => fetchAPI<HistoriaClinica[]>(`/veterinario/historias-clinicas${mascotaId ? `?mascota_id=${encodeURIComponent(mascotaId)}` : ''}`),
  historia: (id: string) => fetchAPI<HistoriaClinica>(`/veterinario/historias-clinicas/${id}`),
  crearHistoria: (payload: HistoriaCreate) => fetchAPI<HistoriaClinica>('/veterinario/historias-clinicas', { method: 'POST', body: JSON.stringify(payload) }),
  mascotas: () => fetchAPI<unknown>('/pets'),
  usuarios: () => fetchAPI<unknown>('/admin/users'),
}

export function asItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) return (value as { items: T[] }).items
  return []
}
const isoDate = (date: string) => date ? new Date(date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
export { isoDate }
export type VeterinarianPet = { id: string; nombre: string; especie?: string; raza?: string; usuario_id?: string }
export type VeterinarianUser = { id: string; nombre: string; email: string; rol?: string }
export type { Turno as VeterinarianTurno, HistoriaClinica as ClinicalHistory }
export const estadoTurno = ['PROGRAMADO', 'ATENDIDO', 'CANCELADO'] as const
export type EstadoTurno = typeof estadoTurno[number]
export const formatDate = isoDate
export const today = () => new Date().toISOString().slice(0, 10)
export const getDateInput = (value: string) => value ? value.slice(0, 16) : ''
export const toIso = (value: string) => new Date(value).toISOString()
export const displayDate = isoDate
export const emptyArray = <T,>(): T[] => []
export const safeString = (value: unknown) => typeof value === 'string' ? value : ''
export const safeNumber = (value: unknown) => typeof value === 'number' ? value : 0
export const safeObject = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {}
export const extractName = (value: unknown) => safeObject(value).nombre as string || 'Sin nombre'
export const extractEmail = (value: unknown) => safeObject(value).email as string || '—'
export const extractId = (value: unknown) => String(safeObject(value).id || '')
export const extractRole = (value: unknown) => safeObject(value).rol as string || 'usuario'
export const normalizeList = <T,>(value: unknown) => asItems<T>(value)
export const formatCurrency = (value: number) => value.toLocaleString('es-AR')
export const formatDateOnly = (value: string) => value ? new Date(value).toLocaleDateString('es-AR') : '—'
export const formatTime = (value: string) => value ? new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'
export const isValidId = (value: string) => value.trim().length > 0
export const parseApiError = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación'
export const buildDateRange = (date: string) => ({ inicio: `${date}T00:00:00`, fin: `${date}T23:59:59` })
export const historyLabel = (history: HistoriaClinica) => `${history.motivo_consulta} · ${formatDateOnly(history.fecha_consulta)}`
export const turnLabel = (turno: Turno) => `${turno.tipo_servicio} · ${formatTime(turno.fecha_hora_inicio)}`
export const apiReady = true
export default veterinarioApi
