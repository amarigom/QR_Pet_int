'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, PawPrint, QrCode, Eye, TrendingUp, Clock, Plus } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { AdminStats } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await adminApi.getStats()
        
        // 🛡️ CONTROL DE CALIDAD (QA): Sanitizamos y formateamos los escaneos recientes 
        // apenas llegan de la API para corregir direcciones y congelar las horas reales.
        if (data && data.recent_scans) {
          data.recent_scans = data.recent_scans.map((scan: any) => {
            const lat = scan.latitud != null ? Number(scan.latitud) : null;
            const lng = scan.longitud != null ? Number(scan.longitud) : null;

            // Gestión de dirección aproximada por coordenadas de respaldo
            let direccion = scan.direccion_aproximada || scan.direccion;
            if (!direccion && lat !== null && lng !== null) {
              direccion = `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            } else if (!direccion) {
              direccion = "Ubicación no disponible";
            }

            // Captura estricta del horario real del evento en la base de datos
            const horarioReal = scan.created_at || scan.fecha || scan.escaneado_en || scan.timestamp || null;

            return {
              ...scan,
              id: String(scan.id ?? Math.random()),
              latitud: lat,
              longitud: lng,
              mascota_nombre: scan.pet_name || scan.mascota_nombre || "Mascota",
              direccion_aproximada: direccion,
              created_at: horarioReal, // Mantiene la hora histórica real del escaneo
              qr_codigo: scan.qr_codigo || ""
            };
          });
        }

        setStats(data)
      } catch (error) {
        console.error('Error loading admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar estadísticas</p>
      </div>
    )
  
  
}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Resumen general del sistema PetQR
          </p>
        </div>
        <Link href="/dashboard/admin/qr">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Generar QRs
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.users_count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Mascotas
            </CardTitle>
            <PawPrint className="w-5 h-5 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pets_count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Mascotas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Codigos QR Activos
            </CardTitle>
            <QrCode className="w-5 h-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.qrs_count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              QR activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Escaneos
            </CardTitle>
            <Eye className="w-5 h-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_scans}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Escaneos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Escaneos por Dia
          </CardTitle>
          <CardDescription>Ultimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          {(!stats || !stats.scans_by_day || stats.scans_by_day.length === 0) ? (
            <p className="text-center text-muted-foreground py-8">
              No hay datos de escaneos
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scans_by_day}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    }}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    }}
                    formatter={(value) => [value, 'Escaneos']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/qr">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Gestionar QRs</h3>
                  <p className="text-sm text-muted-foreground">Generar y administrar codigos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/users">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Usuarios</h3>
                  <p className="text-sm text-muted-foreground">Administrar usuarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/pets">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Mascotas</h3>
                  <p className="text-sm text-muted-foreground">Ver todas las mascotas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
