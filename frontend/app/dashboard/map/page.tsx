'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, PawPrint } from 'lucide-react'
import { adminApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils'
import type { DashboardStats, Pet, RecentScan } from '@/lib/types'

// Ubicación por defecto (Tandil)
const TANDIL_DEFAULT = { lat: -37.32, lng: -59.13 };

const ScanMap = dynamic(() => import('@/components/scan-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-lg" />,
})

export default function MapPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [scans, setScans] = useState<RecentScan[]>([]) 
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [petsData, allScans] = await Promise.all([
          adminApi.getPets(),
          adminApi.getAllScans(1, 200)
        ])

        // MAPEO: Transformamos los datos del backend al tipo RecentScan
        const formattedScans: RecentScan[] = (allScans || []).map((scan: any) => ({
          ...scan,
          id: String(scan.id ?? Math.random()),
          latitud: scan.latitud != null ? Number(scan.latitud) : null,
          longitud: scan.longitud != null ? Number(scan.longitud) : null,
          mascota_nombre: scan.pet_name || scan.mascota_nombre || "Mascota",
          direccion_aproximada: scan.direccion_aproximada || scan.direccion || "Ubicación aproximada",
          created_at: scan.fecha || scan.created_at || scan.escaneado_en || new Date().toISOString(),
          qr_codigo: scan.qr_codigo || ""
        }));

        setPets(petsData || []);
        setScans(formattedScans);
        
        // Sincronizamos con stats para la lista y el contador
        setStats({
          scans_count: formattedScans.length,
          pets_count: petsData.length,
          recent_scans: formattedScans.slice(0, 10) 
        } as DashboardStats);

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

  // Filtramos solo los que tienen coordenadas para el mapa
  const scansWithLocation = scans.filter(
    (s) => s.latitud !== null && s.longitud !== null
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mapa de Escaneos</h1>
        <p className="text-muted-foreground">
          Visualiza donde han sido escaneados los códigos QR de tus mascotas
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicaciones de Escaneos
              </CardTitle>
              <CardDescription>
                {scansWithLocation.length} ubicaciones registradas en el mapa
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {stats?.scans_count || 0} escaneos totales
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] rounded-lg overflow-hidden border bg-muted/20 relative">
            <ScanMap 
              scans={scansWithLocation} 
              pets={pets} 
              initialCenter={TANDIL_DEFAULT} 
            />
            
            {scansWithLocation.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 pointer-events-none z-[1000]">
                <Badge variant="outline" className="bg-background">Sin coordenadas para mostrar</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Escaneos Recientes debajo del mapa */}
      {scans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Últimos Escaneos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scans.slice(0, 6).map((scan) => (
                <div key={scan.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{scan.mascota_nombre}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{scan.direccion_aproximada}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(scan.created_at)}
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