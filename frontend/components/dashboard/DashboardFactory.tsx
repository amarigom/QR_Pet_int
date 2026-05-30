'use client'

import React from 'react'
import AdminDashboard from './strategies/AdminDashboard' // 📂 Ruta actualizada
import UserDashboard from './strategies/UserDashboard'   // 📂 Ruta actualizada

export type UserRole = 'admin' | 'user'

interface DashboardFactoryProps {
  role: string 
  user: any
}

const dashboardStrategies: Record<UserRole, React.ComponentType<{ user: any }>> = {
  admin: AdminDashboard,
  user: UserDashboard,
}

export default function DashboardFactory({ role, user }: DashboardFactoryProps) {
  const normalizedRole = (role?.toLowerCase() || 'user') as UserRole

  const ActiveDashboard = dashboardStrategies[normalizedRole] || UserDashboard

  return <ActiveDashboard user={user} />
}