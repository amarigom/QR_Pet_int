'use client'

import { useEffect, useState, useMemo } from 'react' // Agregué useMemo
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Globe, PawPrint } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { RecentScan, Pet, DashboardStats } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

// Importación dinámica optimizada
const AdminScanMap = dynamic(() => import('@/components/scan-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px] rounded-lg" />,
})

export default function AdminScansPage() {
  const [scans, setScans] = useState<RecentScan[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Ejecutamos en paralelo para mejor performance
        const [petsData, allScans] = await Promise.all([
          adminApi.getPets(),
          adminApi.getAllScans(1, 200)
        ])

        // MAPEO SEGURO: Usamos tipos para evitar el 'any'
        const formattedScans: RecentScan[] = (allScans || []).map((scan: any) => ({
          id: String(scan.id || Math.random()),
          latitud: scan.latitud !== null ? Number(scan.latitud) : null,
          longitud: scan.longitud !== null ? Number(scan.longitud) : null,
          mascota_nombre: scan.mascota_nombre || scan.pet_name || "Mascota desconocida",
          direccion_aproximada: scan.direccion_aproximada || "Ubicación no disponible",
          created_at: scan.created_at || scan.fecha || new Date().toISOString(),
          qr_codigo: scan.qr_codigo || ""
        }));

        setPets(petsData || []);
        setScans(formattedScans);
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // MEMOIZACIÓN: Evitamos cálculos innecesarios en cada render
  const scansWithMapData = useMemo(() => 
    scans.filter(s => s.latitud !== null && s.longitud !== null), 
  [scans]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Monitoreo de Escaneos</h1>
        <p className="text-muted-foreground">Historial global de actividad de códigos QR</p>
      </header>

      <div className="grid gap-6">
        {/* Mapa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" /> Distribución Geográfica
            </CardTitle>
            <Badge variant="secondary">
              {scansWithMapData.length} coordenadas detectadas
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] border rounded-md overflow-hidden bg-muted/20 relative">
              {scansWithMapData.length > 0 ? (
                <AdminScanMap scans={scansWithMapData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <MapPin className="w-8 h-8 opacity-20" />
                  <p>No hay datos GPS para mostrar en Tandil y alrededores</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Escaneos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {scans.length > 0 ? (
                scans.slice(0, 10).map((scan) => (
                  <div key={scan.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <PawPrint className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{scan.mascota_nombre}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{scan.direccion_aproximada}</span>
                      </div>
                    </div>
                    <div className="text-xs text-right text-muted-foreground shrink-0">
                      {formatDateTime(scan.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No se registraron escaneos aún.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}