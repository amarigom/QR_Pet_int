'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PawPrint, QrCode, MapPin, Eye, Clock } from 'lucide-react'
import { petsApi } from '@/lib/api'
import { userApi } from '@/lib/api/user'
import { useAuth } from '@/app/context/auth/AuthContext'
import { formatDateTime } from '@/lib/utils'
import type { DashboardStats, Pet } from '@/lib/types'
import type { UserDashboardStats } from '@/lib/types/user'

export default function DashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth(); 
  const [stats, setStats] = useState<DashboardStats | UserDashboardStats | null>(null)
  const [pets, setPets] = useState<Pet[]>([]) 
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
  const loadData = async () => {
    if (authLoading) return;

    if (!user) {
      console.log("DASHBOARD: No hay sesión activa.");
      setIsLoading(false);
      return;
    }

    console.log("DASHBOARD: Cargando datos para", user.email, "con rol:", user.rol);

    try {
      setIsLoading(true);
      const checkAdmin = user.rol === 'admin';

      if (checkAdmin) {
        // --- Flujo Admin ---
        // Nota: Si el admin tuviera un endpoint de stats diferente, lo cambiarías acá.
        // Si comparte el mismo porque el backend detecta el rol del token, queda igual.
        const [statsData, petsData] = await Promise.all([
          petsApi.getDashboardStats(), 
          petsApi.getAll()
        ]);

        setStats(statsData);
        setPets(petsData?.items || []);

      } else {
        // --- Flujo Usuario Común ---
        console.log("DASHBOARD: Cargando mascotas y estadísticas del usuario común...");
        
        // Usamos tus funciones de petsApi directamente
        const [statsData, petsData] = await Promise.all([
          petsApi.getDashboardStats(), // Llama a /pets/stats/summary
          petsApi.getAll()             // Llama a /pets (raíz)
        ]);

        setStats(statsData);
        // Como ya sabemos que viene un objeto paginado, accedemos a .items de forma segura
        setPets(petsData?.items || []);
      }

    } catch (error) {
      console.error("DASHBOARD: Error cargando datos API:", error);
    } finally {
      setIsLoading(false);
    } 
  };

  loadData();
}, [user, isAdmin, authLoading]);

  // Pantalla de carga (Skeleton)
  if (isLoading || authLoading) {
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
    );
  }

  // Si no hay usuario después de cargar, mostramos el aviso con enlace al login
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Debes iniciar sesión para ver esta página.</p>
        <Link href="/auth/login">
          <Button>Ir al Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Dashboard 
            {isAdmin && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>}
          </h1>
          <p className="text-muted-foreground">Bienvenido, {user.nombre || user.email}</p>
        </div>
        {!isAdmin && (
          <Link href="/dashboard/activate">
            <Button className="shrink-0">
              <QrCode className="w-4 h-4 mr-2" />
              Activar QR
            </Button>
          </Link>
        )}
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Mascotas</CardTitle>
            <PawPrint className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.pets_count || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">QRs Activos</CardTitle>
            <QrCode className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.qrs_count || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Escaneos</CardTitle>
            <Eye className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.scans_count || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Listado de Mascotas */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "Gestión Global de Mascotas" : "Mis Mascotas"}</CardTitle>
          <CardDescription>
            {isAdmin ? "Vista de administrador de todos los registros" : "Gestiona tus mascotas y sus códigos QR activados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay mascotas registradas</h3>
              <p className="text-muted-foreground mb-6">Comienza activando un código QR para tu mascota.</p>
              {!isAdmin && (
                <Link href="/dashboard/activate">
                  <Button variant="outline">Activar mi primer QR</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <Link key={pet.id} href={isAdmin ? `/admin/pets/${pet.id}` : `/dashboard/pets/${pet.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-muted/60">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden border">
                          {pet.foto_url ? (
                            <img src={pet.foto_url} alt={pet.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <PawPrint className="w-8 h-8 text-primary/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{pet.nombre}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {pet.especie} {pet.raza && `• ${pet.raza}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escaneos Recientes */}
      {stats && 'recent_scans' in stats && stats.recent_scans && stats.recent_scans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-red-500" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {stats.recent_scans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-muted-foreground/20 transition-all">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{scan.mascota_nombre || 'Mascota detectada'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {scan.direccion_aproximada || "Ubicación GPS registrada"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(scan.created_at)}
                    </div>
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