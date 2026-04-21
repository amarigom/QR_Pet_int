'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PawPrint, QrCode, MapPin, Eye, Clock } from 'lucide-react'
import { getDashboardStats, getPets } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { DashboardStats, Pet } from '@/lib/types'

export default function DashboardPage() {
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
        console.error('Error loading dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu cuenta PetQR</p>
        </div>
        <Link href="/dashboard/activate">
          <Button>
            <QrCode className="w-4 h-4 mr-2" />
            Activar QR
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Mascotas
            </CardTitle>
            <PawPrint className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.pets_count || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Codigos QR Activos
            </CardTitle>
            <QrCode className="w-5 h-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.qr_count || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Escaneos
            </CardTitle>
            <Eye className="w-5 h-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.scans_count || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pets */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Mascotas</CardTitle>
          <CardDescription>Tus mascotas registradas en PetQR</CardDescription>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-8">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sin mascotas</h3>
              <p className="text-muted-foreground mb-4">
                Activa un codigo QR para registrar tu primera mascota
              </p>
              <Link href="/dashboard/activate">
                <Button>
                  <QrCode className="w-4 h-4 mr-2" />
                  Activar QR
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <Link key={pet.id} href={`/dashboard/pets/${pet.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          {pet.foto_url ? (
                            <img
                              src={pet.foto_url}
                              alt={pet.nombre}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <PawPrint className="w-7 h-7 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{pet.nombre}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {pet.especie} {pet.raza && `- ${pet.raza}`}
                          </p>
                          {pet.color && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Color: {pet.color}
                            </p>
                          )}
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

      {/* Recent Scans */}
      {stats && stats.recent_scans && stats.recent_scans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Escaneos Recientes
            </CardTitle>
            <CardDescription>
              Ultimas ubicaciones donde escanearon tus codigos QR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_scans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{scan.mascota_nombre || 'Mascota'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {scan.latitud && scan.longitud 
                        ? `Lat: ${scan.latitud.toFixed(4)}, Lng: ${scan.longitud.toFixed(4)}`
                        : 'Ubicacion desconocida'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
