import type {
  AdminDashboardData,
  DashboardDataUnion,
  DashboardSummary,
  PetData,
  UserDashboardData,
  VeterinarioDashboardData,
} from '@/lib/types/dashboard'
import type { ScanWithLocation } from '@/lib/types/scan'

interface ApiCollection<T> {
  items?: T[]
  data?: T[]
  results?: T[]
}

type DashboardApiResponse = Partial<UserDashboardData & VeterinarioDashboardData & AdminDashboardData> & {
  data?: Partial<UserDashboardData & VeterinarioDashboardData & AdminDashboardData>
  items?: unknown[]
}

function unwrap(response: DashboardApiResponse | null | undefined): DashboardApiResponse {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return { ...response, ...response.data }
  }

  return response ?? {}
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const collection = value as ApiCollection<T>
    if (Array.isArray(collection.items)) return collection.items
    if (Array.isArray(collection.data)) return collection.data
    if (Array.isArray(collection.results)) return collection.results
  }
  return []
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function adaptUserDashboard(response: DashboardApiResponse): UserDashboardData {
  const data = unwrap(response)
  const pets = asArray<PetData>(data.pets ?? data.items)
  const recentActivity = asArray<ScanWithLocation>(data.recent_activity ?? data.recent_scans ?? data.scans)
  const summary = (data.summary ?? {}) as Partial<DashboardSummary>

  return {
    role: 'user',
    summary: {
      total_pets: toNumber(summary.total_pets ?? data.pets_count ?? pets.length),
      active_qrs: toNumber(summary.active_qrs ?? data.qrs_count),
    },
    pets,
    recent_activity: recentActivity,
  }
}

export function adaptVeterinarioDashboard(response: DashboardApiResponse): VeterinarioDashboardData {
  const data = unwrap(response)
  const stats = (data.stats ?? {}) as Partial<VeterinarioDashboardData['stats']>

  return {
    stats: {
      turnos_hoy: toNumber(stats.turnos_hoy),
      turnos_proximos: toNumber(stats.turnos_proximos),
      historias_clinicas: toNumber(stats.historias_clinicas),
      mascotas_activas: toNumber(stats.mascotas_activas),
      qrs_asignados: toNumber(stats.qrs_asignados),
      documentos_cargados: toNumber(stats.documentos_cargados),
    },
    consultas_por_dia: asArray(data.consultas_por_dia),
  }
}

export function adaptAdminDashboard(response: DashboardApiResponse): AdminDashboardData {
  const data = unwrap(response)

  return {
    users_count: toNumber(data.users_count),
    pets_count: toNumber(data.pets_count),
    qrs_count: toNumber(data.qrs_count),
    scans_count: toNumber(data.scans_count),
    scans_by_day: asArray(data.scans_by_day),
  }
}

export function adaptDashboard(response: DashboardApiResponse, view: 'user' | 'veterinario' | 'admin'): DashboardDataUnion {
  if (view === 'admin') return adaptAdminDashboard(response)
  if (view === 'veterinario') return adaptVeterinarioDashboard(response)
  return adaptUserDashboard(response)
}

export type { DashboardApiResponse }
export { asArray }
export type { ScanWithLocation }
export type { DashboardSummary }
export type { PetData }
export type { AdminDashboardData, UserDashboardData, VeterinarioDashboardData }
export type { ApiCollection }
export type { DashboardDataUnion }
