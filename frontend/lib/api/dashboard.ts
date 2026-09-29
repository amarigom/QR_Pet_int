// lib/api/dashboard.ts
import { fetchAPI } from '@/lib/api/client'
import {
  AdminDashboardData,
  DashboardDataUnion,
  UserDashboardData,
  VeterinarioDashboardData,
} from '@/lib/types/dashboard'
import { ActiveView } from '@/lib/utils'

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : [])

/**
 * Convierte las distintas respuestas posibles del backend al contrato del
 * frontend. Los componentes no necesitan conocer si la API usa items,
 * recent_scans o recent_activity.
 */
export function adaptUserDashboardData(raw: unknown): UserDashboardData {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const pets = asArray(data.pets ?? data.items)
  const recentActivity = asArray(
    data.recent_activity ?? data.recent_scans ?? data.scans,
  )

  return {
    role: 'user',
    summary: {
      total_pets: Number(
        (data.summary as Record<string, unknown> | undefined)?.total_pets ??
          data.pets_count ??
          pets.length,
      ),
      active_qrs: Number(
        (data.summary as Record<string, unknown> | undefined)?.active_qrs ??
          data.qrs_count ??
          0,
      ),
    },
    pets,
    recent_activity: recentActivity as UserDashboardData['recent_activity'],
  }
}

export function adaptVeterinarioDashboardData(raw: unknown): VeterinarioDashboardData {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  return {
    stats: {
      turnos_hoy: Number(data.stats?.turnos_hoy ?? data.turnos_hoy ?? 0),
      turnos_proximos: Number(data.stats?.turnos_proximos ?? data.turnos_proximos ?? 0),
      historias_clinicas: Number(data.stats?.historias_clinicas ?? data.historias_clinicas ?? 0),
      mascotas_activas: Number(data.stats?.mascotas_activas ?? data.mascotas_activas ?? 0),
      qrs_asignados: Number(data.stats?.qrs_asignados ?? data.qrs_asignados ?? 0),
      documentos_cargados: Number(data.stats?.documentos_cargados ?? data.documentos_cargados ?? 0),
    },
    consultas_por_dia: asArray(data.consultas_por_dia ?? data.consultasPorDia) as VeterinarioDashboardData['consultas_por_dia'],
  }
}

export function adaptAdminDashboardData(raw: unknown): AdminDashboardData {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  return {
    users_count: Number(data.users_count ?? data.usersCount ?? 0),
    pets_count: Number(data.pets_count ?? data.petsCount ?? 0),
    qrs_count: Number(data.qrs_count ?? data.qrsCount ?? 0),
    scans_count: Number(data.scans_count ?? data.scansCount ?? 0),
    scans_by_day: asArray(data.scans_by_day ?? data.scansByDay) as AdminDashboardData['scans_by_day'],
  }
}

const adaptadoresPorVista = {
  user: adaptUserDashboardData,
  veterinario: adaptVeterinarioDashboardData,
  admin: adaptAdminDashboardData,
} as const

export type DashboardDataForView<V extends ActiveView> = ReturnType<(typeof adaptadoresPorVista)[V]>

const ENDPOINTS_POR_VISTA: Record<ActiveView, string> = {
  user: '/dashboard/user',
  veterinario: '/dashboard/veterinario',
  admin: '/dashboard/admin',
}

export const dashboardApi = {
  /** Obtiene datos ya adaptados al contrato de la vista solicitada. */
  obtenerPorVista: async (vista: ActiveView): Promise<DashboardDataUnion> => {
    const endpoint = ENDPOINTS_POR_VISTA[vista] || ENDPOINTS_POR_VISTA.user
    const raw = await fetchAPI<unknown>(endpoint, { method: 'GET' })
    return adaptadoresPorVista[vista](raw) as DashboardDataUnion
  },

  // Estos métodos mantienen contratos específicos para evitar uniones incorrectas.
  getUserData: async (): Promise<UserDashboardData> =>
    adaptUserDashboardData(await fetchAPI<unknown>('/dashboard/user', { method: 'GET' })),
  getVeterinarioData: async (): Promise<VeterinarioDashboardData> =>
    adaptVeterinarioDashboardData(await fetchAPI<unknown>('/dashboard/veterinario', { method: 'GET' })),
  getAdminData: async (): Promise<AdminDashboardData> =>
    adaptAdminDashboardData(await fetchAPI<unknown>('/dashboard/admin', { method: 'GET' })),
}
