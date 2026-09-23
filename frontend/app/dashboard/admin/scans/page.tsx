'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Globe, PawPrint } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { RecentScan, Pet } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import DireccionInversa from '@/components/direccion-inversa'
import { ScanMapProvider } from '@/components/map/map-provider' // 🟢 IMPORTACIÓN ALINEADA A LA ESTRUCTURA MODULAR

export default function AdminScansPage() {
  const [scans, setScans] = useState<RecentScan[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [petsData, allScansResponse] = await Promise.all([
          adminApi.getPets(),
          adminApi.getAllScans(1, 200)
        ])

        const rawResponse = allScansResponse as any;
        const rawItems = Array.isArray(rawResponse) 
          ? rawResponse 
          : (rawResponse?.items || []);

        const formattedScans: RecentScan[] = rawItems.map((scan: any) => ({
          id: String(scan.id || Math.random()),
          latitud: scan.latitud !== null && scan.latitud !== undefined ? Number(scan.latitud) : null,
          longitud: scan.longitud !== null && scan.longitud !== undefined ? Number(scan.longitud) : null,
          mascota_nombre: scan.pet_name || scan.mascota_nombre || "Mascota desconocida",
          direccion_aproximada: scan.direccion_aproximada || "",
          created_at: scan.escaneado_en || scan.created_at || scan.fecha,
          qr_codigo: scan.qr_codigo || "N/A"
        }))

        setPets(petsData || [])
        setScans(formattedScans)
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const scansWithMapData = useMemo(() => 
    scans.filter(s => s.latitud !== null && s.longitud !== null && s.latitud !== 0), 
  [scans])

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
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Monitoreo de Escaneos</h1>
        <p className="text-muted-foreground text-sm">Historial global de actividad de códigos QR</p>
      </header>

      <div className="grid gap-6">
        {/* MAPA DE DISTRIBUCIÓN */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" /> Distribución Geográfica
            </CardTitle>
            <Badge variant="secondary" className="font-semibold">
              {scansWithMapData.length} coordenadas detectadas
            </Badge>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 w-full max-w-full overflow-hidden">
            {scansWithMapData.length > 0 ? (
              <ScanMapProvider scans={scansWithMapData} isAdmin={true} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground gap-2 border rounded-xl bg-muted/10">
                <MapPin className="w-8 h-8 opacity-20" />
                <p className="text-sm">No hay datos GPS válidos para ubicar en el mapa.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LISTA DE ALERTAS RECIENTES */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-destructive" /> Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {scans.length > 0 ? (
                scans.map((scan) => {
                  const tieneGPS = scan.latitud !== null && scan.longitud !== null;

                  return (
                    <div key={scan.id} className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <PawPrint className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm truncate">{scan.mascota_nombre}</p>
                          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold tracking-wider shrink-0">
                            QR: {scan.qr_codigo}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          {scan.direccion_aproximada && 
                           scan.direccion_aproximada !== "Sin dirección registrada" && 
                           scan.direccion_aproximada !== "Ubicación no disponible" ? (
                            <span className="truncate">{scan.direccion_aproximada}</span>
                          ) : tieneGPS ? (
                            <DireccionInversa lat={scan.latitud!} lng={scan.longitud!} />
                          ) : (
                            <span className="text-gray-400">📍 Sin GPS (Escaneo ciego)</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-right text-muted-foreground shrink-0 font-medium">
                        {scan.created_at ? formatDateTime(scan.created_at) : 'Sin fecha'}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">No se registraron escaneos aún.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}