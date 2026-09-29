import VeterinarianDashboard from '@/components/dashboard/strategies/VeterinarianDashboard'
import { dashboardApi } from '@/lib/api/dashboard'
import { authApi } from '@/lib/api/auth'

export default async function VeterinarioPage() {
  const [data, user] = await Promise.all([dashboardApi.getVeterinarioData(), authApi.getCurrentUser()])
  return <VeterinarianDashboard data={data} user={user} />
}

export const dynamic = 'force-dynamic'
