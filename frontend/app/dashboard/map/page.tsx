'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, PawPrint } from 'lucide-react'
import { getDashboardStats, getPets } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { DashboardStats, Pet ,Scan,ScanWithLocation} from '@/lib/types'

// Dynamic import for Leaflet (client-side only)
const ScanMap = dynamic(() => import('@/components/scan-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
})

export default function MapPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, petsData] = await Promise.all([
          getDashboardStats(),
          getPets(),
        ])
        setStats(statsData)
        setPets(petsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const scansWithLocation: ScanWithLocation[] = (stats?.recent_scans || [])
  .filter((s) => s.latitud !== null && s.longitud !== null)
  .map((s) => ({
    ...s, // Copia todo lo de Scan (incluyendo los opcionales si existen)
    pet_name: s.mascota_nombre,
    escaneado_en: s.created_at,
    latitud: s.latitud as number,
    longitud: s.longitud as number,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mapa de Escaneos</h1>
        <p className="text-muted-foreground">
          Visualiza donde han sido escaneados los codigos QR de tus mascotas
        </p>
      </div>

      {/* Map */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicaciones de Escaneos
              </CardTitle>
              <CardDescription>
                {scansWithLocation.length} ubicaciones registradas
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {stats?.scans_count || 0} escaneos totales
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {scansWithLocation.length === 0 ? (
            <Empty className="py-12 border-2">
  <div className="flex flex-col items-center gap-2">
    {/* El icono lo renderizamos adentro */}
    <MapPin className="w-12 h-12 text-muted-foreground" />
    
    <div className="space-y-1">
      <h3 className="font-medium text-lg">Sin ubicaciones</h3>
      <p className="text-sm text-muted-foreground">
        Aun no hay escaneos con ubicacion registrada
      </p>
    </div>
  </div>
</Empty>
          ) : (
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <ScanMap scans={scansWithLocation} pets={pets} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Scans List */}
      {stats && stats.recent_scans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Escaneos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_scans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{scan.mascota_nombre || 'Mascota'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {scan.direccion_aproximada || (scan.latitud && scan.longitud
                          ? `${scan.latitud.toFixed(4)}, ${scan.longitud.toFixed(4)}`
                          : 'Ubicacion desconocida')}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(scan.escaneado_en)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
