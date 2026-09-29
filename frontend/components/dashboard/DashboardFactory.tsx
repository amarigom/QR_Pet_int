'use client'

import React from 'react'
import AdminDashboard from '@/components/dashboard/strategies/AdminDashboard' 
import UserDashboard from '@/components/dashboard/strategies/UserDashboard'
import VeterinarianDashboard from '@/components/dashboard/strategies/VeterinarianDashboard'   

export type UserRole = 'admin' | 'user' | 'veterinario'

interface DashboardFactoryProps {
  role?: string 
  dashboardData: any 
  user: any 
}

// Mapa de estrategias asociadas a cada rol
const dashboardStrategies: Record<UserRole, React.ComponentType<any>> = {
  admin: AdminDashboard,
  user: UserDashboard,
  veterinario: VeterinarianDashboard,
}

export default function DashboardFactory({ role, user, dashboardData }: DashboardFactoryProps) {

  console.log('🔍 [DEBUG FACTORY] Role prop recibida:', role)
  // 1. Buscamos el rol en la prop explicita o dentro del objeto user
  const rawRole = (role || user?.rol || user?.role || 'user').toString().toLowerCase().trim()

  // 2. Mapeo flexible considerando posibles variaciones de nombres de rol
  let normalizedRole: UserRole = 'user'

  if (rawRole === 'admin' || rawRole === 'administrador') {
    normalizedRole = 'admin'
  } else if (rawRole === 'veterinario' || rawRole === 'vet') {
    normalizedRole = 'veterinario'
  }

  // 3. Seleccionamos el componente dinámico correspondiente
  const ActiveDashboard = dashboardStrategies[normalizedRole] || UserDashboard

  // 4. Renderizamos el Dashboard asignado pasando las props
  return <ActiveDashboard user={user} data={dashboardData} />
}