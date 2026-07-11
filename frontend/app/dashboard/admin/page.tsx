'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import AdminDashboard from '@/components/dashboard/strategies/AdminDashboard' // 🌟 Tu componente estrategia
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/app/context/auth/AuthContext'

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true)
        const data = await adminApi.getStats()
        
        // 🛡️ CONTROL DE CALIDAD (QA): Dejamos el formateo de los escaneos que ya tenías
        if (data && data.recent_scans) {
          data.recent_scans = data.recent_scans.map((scan: any) => {
            const lat = scan.latitud != null ? Number(scan.latitud) : null
            const lng = scan.longitud != null ? Number(scan.longitud) : null

            let direccion = scan.direccion_aproximada || scan.direccion
            if (!direccion && lat !== null && lng !== null) {
              direccion = `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            } else if (!direccion) {
              direccion = "Ubicación no disponible"
            }

            return {
              ...scan,
              id: String(scan.id ?? Math.random()),
              latitud: lat,
              longitud: lng,
              mascota_nombre: scan.pet_name || scan.mascota_nombre || "Mascota",
              direccion_aproximada: direccion,
              created_at: scan.created_at || scan.fecha || null,
            }
          })
        }

        setStats(data)
      } catch (error) {
        console.error('Error loading admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      loadStats()
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar estadísticas del administrador</p>
      </div>
    )
  }

  // 🌟 PUENTE DE ORO: Renderizamos tu componente de Estrategia inyectándole la data limpia
  return <AdminDashboard user={user} data={stats} />
}