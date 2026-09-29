// lib/api/dashboard.ts
import { fetchAPI } from '@/lib/api/client'
import { DashboardDataUnion } from '@/lib/types/dashboard'
import { ActiveView } from '@/lib/utils'

const ENDPOINTS_POR_VISTA: Record<ActiveView, string> = {
  user: '/dashboard/user',
  veterinario: '/dashboard/veterinario',
  admin: '/dashboard/admin',
}

export const dashboardApi = {
  /**
   * Obtiene la información del dashboard según la vista activa
   */
  obtenerPorVista: (vista: ActiveView) => {
    const endpoint = ENDPOINTS_POR_VISTA[vista] || ENDPOINTS_POR_VISTA.user
    return fetchAPI<DashboardDataUnion>(endpoint, { method: 'GET' })
  },

  // Mantenemos los métodos individuales por retrocompatibilidad si otros componentes los usan
  getUserData: () => fetchAPI<DashboardDataUnion>('/dashboard/user', { method: 'GET' }),
  getVeterinarioData: () => fetchAPI<DashboardDataUnion>('/dashboard/veterinario', { method: 'GET' }),
  getAdminData: () => fetchAPI<DashboardDataUnion>('/dashboard/admin', { method: 'GET' }),
}