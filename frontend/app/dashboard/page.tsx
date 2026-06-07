'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/app/context/auth/AuthContext'
import DashboardFactory from '@/components/dashboard/DashboardFactory' 
import { dashboardApi } from '@/lib/api/dashboard'
import { UserDashboardData } from '@/lib/types/dashboard'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchDashboardContent() {
      if (authLoading || !user) return
      try {
        setDataLoading(true)
        const data = await dashboardApi.getUserData()
        setDashboardData(data)
      } catch (error) {
        console.error("Error al cargar el dashboard:", error)
      } finally {
        setDataLoading(false)
      }
    }
    fetchDashboardContent()
  }, [user, authLoading])

  if (authLoading || (user && dataLoading)) {
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

  return (
    <div className="container mx-auto p-4 md:p-6">
      <DashboardFactory 
        role={'user'} 
        user={user} 
        dashboardData={dashboardData} 
      />
    </div>
  )
}