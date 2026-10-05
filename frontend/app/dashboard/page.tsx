'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth/AuthContext'
import DashboardFactory from '@/components/dashboard/DashboardFactory' 
import { dashboardApi } from '@/lib/api/dashboard'
import { UserDashboardData } from '@/lib/types/dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, enModoUsuario } = useAuth()
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const shouldLoadUserDashboard = user?.rol === 'usuario' || (
    user?.rol === 'admin' && enModoUsuario
  )

  useEffect(() => {
    let isActive = true

    async function fetchDashboardContent() {
      if (authLoading) return
      if (!user || !shouldLoadUserDashboard) {
        setDashboardData(null)
        if (isActive) setDataLoading(false)
        return
      }
      try {
        if (isActive) setDataLoading(true)
        const data = await dashboardApi.getUserData()
        if (isActive) setDashboardData(data)
      } catch (error) {
        console.error("Error al cargar el dashboard:", error)
        if (isActive) setDashboardData(null)
      } finally {
        if (isActive) setDataLoading(false)
      }
    }
    fetchDashboardContent()
    return () => {
      isActive = false
    }
  }, [user, authLoading, shouldLoadUserDashboard])

  useEffect(() => {
    if (!authLoading && user?.rol === 'admin' && !enModoUsuario) {
      router.replace('/dashboard/admin')
    }
  }, [authLoading, enModoUsuario, router, user])

  if (authLoading || (shouldLoadUserDashboard && dataLoading)) {
    return <div className="p-6">Cargando panel...</div> // Reemplazar por tus Skeletons
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Debes iniciar sesión para ver esta página.</p>
        <Link href="/auth/login"><Button>Ir al Login</Button></Link>
      </div>
    )
  }

  if (user.rol === 'admin' && !enModoUsuario) return null
  if (user.rol === 'veterinario') {
    return (
      <div className="w-full min-w-0">
        <DashboardFactory role="veterinario" user={user} />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudieron cargar los datos del panel.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      <DashboardFactory role="usuario" user={user} data={dashboardData} />
    </div>
  )
}