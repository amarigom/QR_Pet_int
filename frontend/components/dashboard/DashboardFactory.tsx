'use client'

import type { ReactNode } from 'react'
import AdminDashboard from '@/components/dashboard/strategies/AdminDashboard'
import UserDashboard from '@/components/dashboard/strategies/UserDashboard'
import VeterinarianDashboard from '@/components/dashboard/strategies/VeterinarianDashboard'
import type { AdminDashboardData, UserDashboardData } from '@/lib/types/dashboard'
import type { User } from '@/lib/types/auth'

export type DashboardRole = 'admin' | 'usuario' | 'veterinario'

type AdminDashboardProps = {
  role: 'admin'
  user: User
  data: AdminDashboardData
}

type UserDashboardProps = {
  role: 'usuario'
  user: User
  data: UserDashboardData
}

type VeterinarianDashboardProps = {
  role: 'veterinario'
  user: User
}

export type DashboardFactoryProps =
  | AdminDashboardProps
  | UserDashboardProps
  | VeterinarianDashboardProps

const dashboardStrategies = {
  admin: ({ user, data }: AdminDashboardProps): ReactNode => (
    <AdminDashboard user={user} data={data} />
  ),
  usuario: ({ user, data }: UserDashboardProps): ReactNode => (
    <UserDashboard user={user} data={data} />
  ),
  veterinario: ({ user }: VeterinarianDashboardProps): ReactNode => (
    <VeterinarianDashboard user={user} />
  ),
}

export default function DashboardFactory(props: DashboardFactoryProps) {
  switch (props.role) {
    case 'admin':
      return dashboardStrategies.admin(props)
    case 'usuario':
      return dashboardStrategies.usuario(props)
    case 'veterinario':
      return dashboardStrategies.veterinario(props)
  }
}