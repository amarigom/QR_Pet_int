'use client'


import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth/AuthContext'
import DashboardFactory from '@/components/dashboard/DashboardFactory' 
import { dashboardApi } from '@/lib/api/dashboard'
import { resolverVistaValida } from '@/lib/utils'
import { DashboardDataUnion } from '@/lib/types/dashboard'


export default function DashboardPage() {
  const { user, loading: authLoading, enModoUsuario } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardDataUnion | null>(null)
  const [dataLoading, setDataLoading] = useState<boolean>(true)

  // 1. Invariante de Dominio: Se resuelve la vista válida en 1 sola línea declarativa
  // 🔍 LOG 1: Verificar el objeto usuario real del backend y la bandera del contexto
  console.log('🔍 [DEBUG PAGE] User object:', user)
  console.log('🔍 [DEBUG PAGE] enModoUsuario:', enModoUsuario)

  const rolNormalizado = user?.rol === 'veterinarian' || user?.rol === 'vet'
    ? 'veterinario'
    : user?.rol === 'user'
      ? 'usuario'
      : user?.rol
  const vistaDeseada = enModoUsuario && rolNormalizado !== 'admin' ? 'user' : rolNormalizado
  const vistaActiva = resolverVistaValida(rolNormalizado, enModoUsuario)
 // 🔍 LOG 2: Verificar la vista que finalmente se resuelve
  console.log('🔍 [DEBUG PAGE] Vista Deseada vs Resuelta:', { vistaDeseada, vistaActiva })
  
  useEffect(() => {
    async function cargarDashboard() {
      if (authLoading || !user) return
      
      try {
        setDataLoading(true)
        // Pide los datos a /dashboard/user, /dashboard/veterinario o /dashboard/admin
        const data = await dashboardApi.obtenerPorVista(vistaActiva)
        setDashboardData(data)
      } catch (error) {
        console.error("Error al cargar el dashboard:", error)
      } finally {
        setDataLoading(false)
      }
    }

    cargarDashboard()
  }, [user, authLoading, vistaActiva])

  if (authLoading || (user && dataLoading)) {
    return <div className="p-6">Cargando panel...</div>
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
    <div className="w-full min-w-0">
      <DashboardFactory 
        role={vistaActiva} 
        user={user} 
        dashboardData={dashboardData} 
      />
    </div>
  )
}
