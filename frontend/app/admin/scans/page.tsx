'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Globe } from 'lucide-react'
import { getAdminStats } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { AdminStats, ScanWithLocation } from '@/lib/types'

const AdminScanMap = dynamic(() => import('@/components/admin-scan-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px] rounded-lg" />,
})

export default function AdminScansPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminStats()
        
        // --- NORMALIZACIÓN DE DATOS ---
        // Usamos 'any' en el map para evitar que TS se queje de los campos originales de la DB
        const normalizedScans: ScanWithLocation[] = (data.recent_scans || []).map((s: any) => ({
          ...s,
          pet_name: s.mascota_nombre || s.pet_name || 'Mascota',
          owner_name: s.usuario_nombre || s.owner_name || 'Usuario',
          escaneado_en: s.created_at || s.escaneado_en,
          direccion: s.direccion_aproximada || s.direccion || 'Sin dirección',
          // Aseguramos que latitud y longitud sean números o null
          latitud: s.latitud !== null ? Number(s.latitud) : null,
          longitud: s.longitud !== null ? Number(s.longitud) : null
        }))

        // Guardamos en el estado. 
        // IMPORTANTE: Si AdminStats da error, usamos 'as AdminStats' para forzar la aceptación
        setStats({
          ...data,
          recent_scans: normalizedScans
        } as AdminStats)

      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  // Ahora extraemos los datos de forma segura
  const recentScans = (stats as any)?.recent_scans || []
  
  // Filtramos para el mapa asegurando que latitud y longitud sean válidos
  const scansWithLocation = recentScans.filter(
    (s: any) => s.latitud && s.longitud
  )

  return (
  
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mapa Global de Escaneos</h1>
        <p className="text-muted-foreground">
          Visualiza todos los escaneos del sistema
        </p>
      </div>

      {/* Global Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Mapa de Escaneos
              </CardTitle>
              <CardDescription>
                {scansWithLocation.length} ubicaciones con coordenadas
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {stats?.scans_count || 0} escaneos totales
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] rounded-lg overflow-hidden border">
            {/* Le pasamos los datos normalizados al mapa */}
            <AdminScanMap scans={scansWithLocation} />
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Escaneos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentScans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay escaneos registrados
            </p>
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan :any) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{scan.pet_name}</p>
                      <span className="text-muted-foreground">por</span>
                      <Badge variant="outline" className="text-xs">
                        {scan.owner_name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {scan.direccion_aproximada ||
                        (scan.latitud && scan.longitud
                          ? `${scan.latitud.toFixed(4)}, ${scan.longitud.toFixed(4)}`
                          : 'Sin ubicación')}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(scan.escaneado_en)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}