'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import DashboardFactory from '@/components/dashboard/DashboardFactory'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/app/context/auth/AuthContext'
import type { AdminDashboardData } from '@/lib/types/dashboard'

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true)
        const data = await adminApi.getStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      if (user?.rol === 'admin') {
        loadStats()
      } else {
        setIsLoading(false)
      }
    }
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (user?.rol !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tenés permisos para ver el panel de administración.</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar estadísticas del administrador</p>
      </div>
    )
  }

  return <DashboardFactory role="admin" user={user} data={stats} />
}