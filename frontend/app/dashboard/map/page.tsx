
"use client";

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, PawPrint } from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard'
import { adminApi, petsApi, scansApi } from '@/lib/api'
import { useAuth } from '@/app/context/auth/AuthContext'
import { formatDateTime } from '@/lib/utils'

import type { DashboardStats, Pet, RecentScan } from '@/lib/types'
import type { UserDashboardData } from '@/lib/types/dashboard'

// Ubicación por defecto (Tandil)
const TANDIL_DEFAULT = { lat: -37.32, lng: -59.13 };

// Cargamos el mapa de forma dinámica deshabilitando SSR
const ScanMap = dynamic(() => import('@/components/scan-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[450px] rounded-lg" />,
})

export default function MapPage() {
  const { user, loading: authLoading, enModoUsuario } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [scans, setScans] = useState<RecentScan[]>([]) 
  const [isLoading, setIsLoading] = useState(true)

  // QA: Evita ejecuciones paralelas simultáneas en milisegundos
  const estaCargandoRef = useRef(false);
  const datosCargadosRef = useRef(false);

  // 🌟 CONTROL DE CAMBIO DE ROL: Guarda el último estado del interruptor de vista
  const ultimoModoRef = useRef(enModoUsuario);

  // Extraemos variables primitivas seguras para romper las referencias falsas en memoria del objeto user
  const userId = user?.id || user?.email || '';
  const userRol = user?.rol || '';

  useEffect(() => {
    // 1. Si el contexto de autenticación sigue procesando, congelamos la ejecución
    if (authLoading || !userId || !userRol) {
      return;
    }

    // 🌟 CORRECCIÓN CRÍTICA: Si el usuario cambió de vista (Admin <-> Usuario),
    // abrimos el candado inmediatamente para permitir que el fetch pida los nuevos datos
    if (ultimoModoRef.current !== enModoUsuario) {
      datosCargadosRef.current = false;
      ultimoModoRef.current = enModoUsuario;
    }

    // 2. Si ya hay una petición en vuelo o si ya se completó con éxito,
    // interceptamos el doble disparo simultáneo inmediatamente.
    if (estaCargandoRef.current || datosCargadosRef.current) {
      return;
    }

    async function loadData() {
      try {
        estaCargandoRef.current = true;
        setIsLoading(true);
        
        const isAdminGlobal = userRol === 'admin' && enModoUsuario === false;

        let rawPets: any[] = [];
        let rawScans: any[] = [];

        if (isAdminGlobal) {
          console.log("MAPA: Cargando datos globales como Administrador...");
          const [petsRes, scansRes] = await Promise.all([
            adminApi.getPets(),
            adminApi.getAllScans(1, 200)
          ]);
          
          // CORRECCIÓN DE TIPADO SEGURO:
          rawPets = (petsRes as any)?.items || (Array.isArray(petsRes) ? petsRes : []);
          rawScans = (scansRes as any)?.items || (Array.isArray(scansRes) ? scansRes : []);
        } else {
          console.log("MAPA: Cargando datos del usuario común...");
          const dashboardRes: UserDashboardData = await dashboardApi.getUserData();

          rawPets = dashboardRes.pets || [];
          rawScans = (dashboardRes as any).recent_scans || [];
        } 

        const formattedScans: RecentScan[] = rawScans.map((scan: any) => ({
          ...scan,
          id: String(scan.id ?? Math.random()),
          latitud: scan.latitud != null ? Number(scan.latitud) : null,
          longitud: scan.longitud != null ? Number(scan.longitud) : null,
          mascota_nombre: scan.pet_name || scan.mascota_nombre || "Mascota",
          direccion_aproximada: scan.direccion_aproximada || scan.direccion || "Ubicación aproximada",
          created_at: scan.fecha || scan.created_at || scan.escaneado_en || new Date().toISOString(),
          qr_codigo: scan.qr_codigo || ""
        }));

        setPets(rawPets);
        setScans(formattedScans);
        
        setStats({
          scans_count: formattedScans.length,
          pets_count: rawPets.length,
          recent_scans: formattedScans.slice(0, 10) 
        } as DashboardStats);

        // Confirmamos éxito de la carga de datos
        datosCargadosRef.current = true;

      } catch (error) {
        console.error('Error loading data in MapPage:', error);
      } finally {
        // Liberamos el candado de ejecución para permitir recargas si cambian los parámetros base
        estaCargandoRef.current = false;
        setIsLoading(false);
      }
    }

    loadData();

  // Agregamos enModoUsuario para que el useEffect se vuelva a disparar al cambiar de vista
  }, [userId, userRol, authLoading, enModoUsuario]); 

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[450px]" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  // Filtramos los escaneos que realmente tienen lat y lng válidas
  const scansWithLocation = scans.filter(
    (s) => s.latitud !== null && s.longitud !== null
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {userRol === 'admin' && !enModoUsuario ? "Mapa Global de Escaneos" : "Mapa de mis Mascotas"}
        </h1>
        <p className="text-muted-foreground">
          {userRol === 'admin' && !enModoUsuario 
            ? "Visualiza la ubicación de todos los códigos QR escaneados en el sistema" 
            : "Visualiza donde han sido escaneados los códigos QR de tus mascotas"}
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
            
            {!isLoading && scansWithLocation.length > 0 ? (
              <ScanMap 
                scans={scansWithLocation} 
                pets={pets} 
                initialCenter={TANDIL_DEFAULT} 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 gap-2">
                {isLoading ? (
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Sincronizando coordenadas con el mapa...
                  </span>
                ) : (
                  <Badge variant="outline" className="bg-background">
                    Sin coordenadas para mostrar
                  </Badge>
                )}
              </div>
            )}
            
          </div>
        </CardContent>
      </Card>

      {/* Lista de Escaneos Recientes */}
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