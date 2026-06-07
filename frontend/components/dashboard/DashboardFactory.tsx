'use client'

import React from 'react'
import AdminDashboard from '@/components/dashboard/strategies/AdminDashboard' 
import UserDashboard from '@/components/dashboard/strategies/UserDashboard'   

// 🎯 Tipado estricto adaptado a tu base de datos
export type UserRole = 'admin' | 'user'

interface DashboardFactoryProps {
  role: string 
  dashboardData: any 
  user: any 
}

// 🎯 Mapa de estrategias limpio y directo
const dashboardStrategies = {
  admin: AdminDashboard,
  user: UserDashboard,
}

export default function DashboardFactory({ role, user, dashboardData }: DashboardFactoryProps) {
  // 1. Normalizamos el rol a minúsculas con fallback seguro a 'user'
  const normalizedRole = (role?.toLowerCase() === 'admin' ? 'admin' : 'user') as UserRole
  
  const ActiveDashboard = dashboardStrategies[normalizedRole] || UserDashboard

  // 3. Forzamos el tipado como componente dinámico para que TypeScript acepte las propiedades
  const ComponentToRender = ActiveDashboard as React.ComponentType<any>

  // 4. Retornamos inyectando de forma segura 'user' y 'data' (dashboardData)
  return <ComponentToRender user={user} data={dashboardData} />
}