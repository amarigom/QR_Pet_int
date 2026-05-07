'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Globe } from 'lucide-react'
import { adminApi } from '@/lib/api'


// Importación dinámica del mapa para evitar errores de SSR
const AdminScanMap = dynamic(() => import('@/components/admin-scan-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px] rounded-lg" />,
})

import { ScanResponse, ScanWithLocation } from '@/lib/types'
import { scansApi } from '@/lib/api' // Usamos la nueva API de escaneos
import { formatDateTime } from '@/lib/utils' // Asumiendo que tenés esta util

export default function AdminScansPage() {
  const [scans, setScans] = useState<ScanWithLocation[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        // Usamos el método de la nueva API que ya devuelve el tipo correcto
        const response = await scansApi.getAll(1, 100) 
        
        const normalized: ScanWithLocation[] = (response.items || []).map((s: ScanResponse) => {
  // 1. Manejo seguro de la mascota (Objeto vs String)
  let name = 'Sin nombre';
  let owner = 'Admin View';

  if (typeof s.mascota === 'object' && s.mascota !== null) {
    name = s.mascota.nombre;
    owner = s.mascota.owner?.nombre || 'Sin dueño';
  } else if (typeof s.mascota === 'string') {
    name = s.mascota;
  }

  // 2. Manejo seguro de coordenadas
  let lat: number | null = null;
  let lng: number | null = null;
  
  if (s.coordenadas && s.coordenadas.includes(',')) {
    const parts = s.coordenadas.split(',');
    lat = parseFloat(parts[0]);
    lng = parseFloat(parts[1]);
  }

  return {
    id: s.id.toString(),
    pet_name: name,
    qr_codigo: s.qr_codigo,
    escaneado_en: s.fecha,
    direccion: s.ubicacion || 'Sin dirección',
    latitud: isNaN(lat!) ? null : lat,
    longitud: isNaN(lng!) ? null : lng,
    owner_name: owner
  };
});
        setScans(normalized)
        setTotalCount(response.total || 0)
      } catch (error) {
        console.error('Error al cargar escaneos:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // ... (El resto del render se mantiene igual, pero ahora 'scan.pet_name' es garantizadamente un string)

  if (isLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>
  }

  // Filtramos solo los que tienen coordenadas para el mapa
  const scansWithMapData = scans.filter(s => s.latitud !== null && s.longitud !== null)

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
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Mapa de Calor</CardTitle>
            <Badge>{scansWithMapData.length} puntos en el mapa</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] border rounded-md overflow-hidden bg-muted/20">
    {scansWithMapData.length > 0 ? (
      <AdminScanMap 
        key={`map-instance-${scansWithMapData.length}`} 
        scans={scansWithMapData} 
      />
    ) : (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay datos de ubicación para mostrar en el mapa
      </div>
    )}
  </div>
          </CardContent>
        </Card>

        {/* Lista de Escaneos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-full"><MapPin className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-semibold">{scan.pet_name} <span className="text-xs text-muted-foreground font-mono">[{scan.qr_codigo}]</span></p>
                    <p className="text-sm text-muted-foreground">{scan.direccion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDateTime(scan.escaneado_en)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}