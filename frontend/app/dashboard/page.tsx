'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/app/context/auth/AuthContext'
import DashboardFactory from '@/components/dashboard/DashboardFactory' 

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()

  // 1. Pantalla de carga (Mantenemos tus Skeletons prolijos mientras valida el token)
  if (authLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // 2. Control de seguridad: Si no hay sesión activa después de cargar
  if (!user) {
    console.log("DASHBOARD: No hay sesión activa.")
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Debes iniciar sesión para ver esta página.</p>
        <Link href="/auth/login">
          <Button>Ir al Login</Button>
        </Link>
      </div>
    )
  }

  // 3. El puente de la arquitectura: Delegamos todo al Factory
  console.log("DASHBOARD: Redirigiendo al Factory para", user.email, "con rol:", user.rol)
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <DashboardFactory role={user.rol || 'user'} user={user} />
    </div>
  )
}