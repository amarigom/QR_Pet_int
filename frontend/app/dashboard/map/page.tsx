'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, PawPrint } from 'lucide-react'
import { adminApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils'
import type { DashboardStats, Pet, ScanWithLocation } from '@/lib/types'

// Ubicación por defecto (Tandil) por si no hay escaneos todavía
const TANDIL_DEFAULT = { lat: -37.32, lng: -59.13 };

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
          adminApi.getStats(),
          adminApi.getPets(),
        ])

        // MAPEO ELÁSTICO: Buscamos nombres alternativos y aseguramos tipos de datos
        const formattedScans = (statsData.recent_scans || []).map((scan: any) => {
          const lat = scan.latitud ?? scan.lat ?? scan.latitude;
          const lng = scan.longitud ?? scan.lng ?? scan.longitude;

          return {
            id: scan.id ?? Math.random(),
            // Solo convertimos a número si el dato existe, si no, dejamos null para filtrar después
            latitud: lat != null ? Number(lat) : null,
            longitud: lng != null ? Number(lng) : null,
            mascota_nombre: scan.mascota_nombre || scan.pet_name || "Mascota",
            fecha: scan.fecha || scan.escaneado_en || scan.created_at || new Date().toISOString(),
            direccion: scan.direccion || scan.direccion_aproximada || "Ubicación aproximada",
          }
        });

        setStats({
          total_scans: statsData.total_scans || 0,
          recent_scans: formattedScans,
          scans_count: statsData.scans_count || statsData.total_scans || 0
        });
        
        setPets(petsData || []);
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

  // Filtramos solo los que tienen coordenadas válidas para el componente ScanMap
  const scansWithLocation: ScanWithLocation[] = (stats?.recent_scans || [])
    .filter((s) => s.latitud !== null && s.longitud !== null)
    .map((s) => ({
      ...s,
      pet_name: s.mascota_nombre,
      latitud: s.latitud as number,
      longitud: s.longitud as number,
    }));

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
                {scansWithLocation.length} ubicaciones registradas
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {stats?.scans_count || 0} escaneos totales
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* 
              CAMBIO CLAVE: Quitamos el condicional de 'length === 0' para el contenedor del mapa.
              Queremos que el mapa se cargue SIEMPRE. El componente ScanMap debería 
              manejar si tiene o no markers internos.
          */}
          <div className="h-[400px] rounded-lg overflow-hidden border bg-muted/20 relative">
            <ScanMap 
              scans={scansWithLocation} 
              pets={pets} 
              // Pasamos Tandil como centro por defecto si no hay datos
              initialCenter={TANDIL_DEFAULT} 
            />
            
            {scansWithLocation.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 pointer-events-none">
                <Badge variant="outline" className="bg-background">Sin escaneos registrados aún</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Escaneos Recientes */}
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
                <div key={scan.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{scan.mascota_nombre}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{scan.direccion}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(scan.fecha)}
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