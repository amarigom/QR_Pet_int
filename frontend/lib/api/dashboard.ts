import type { UserDashboardData } from '@/lib/types/dashboard'
import { adaptDashboardResponse } from '@/lib/adapters/dashboardAdapter'
import { fetchAPI } from './client'

export const dashboardApi = {
  getUserData: async (): Promise<UserDashboardData> => {
    const response = await fetchAPI<unknown>('/dashboard/user')
    return adaptDashboardResponse(response)
  },
}