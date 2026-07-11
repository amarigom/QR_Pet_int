
'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, PawPrint, QrCode, Eye, TrendingUp, Clock, Plus, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AdminDashboardProps {
  user: any
  data: {
    users_count: number
    pets_count: number
    qrs_count: number
    scans_count: number
    scans_by_day?: Array<{ date: string; count: number }>
  }
}

export default function AdminDashboard({ user, data }: AdminDashboardProps) {
  const totalUsuarios = data?.users_count ?? 0
  const totalMascotas = data?.pets_count ?? 0
  const totalQrs = data?.qrs_count ?? 0
  const totalEscaneos = data?.scans_count ?? 0 
  const scansByDay = data?.scans_by_day ?? []

  // 🧮 Cálculo dinámico del promedio diario basado en los últimos 30 días
  const promedioDiario = (() => {
    if (!scansByDay || scansByDay.length === 0) return 0
    const sumaEscaneos = scansByDay.reduce((acc, curr) => acc + (curr.count ?? 0), 0)
    const promedio = sumaEscaneos / scansByDay.length
    // Redondeamos a 1 decimal para que quede prolijo (ej: 4.2 escaneos/día)
    return Number(promedio.toFixed(1))
  })()

  return (
    <div className="space-y-6">
      {/* Encabezado */}
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

      {/* Stats Cards Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsuarios}</p>
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
            <p className="text-3xl font-bold">{totalMascotas}</p>
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
            <p className="text-3xl font-bold">{totalQrs}</p>
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
            <p className="text-3xl font-bold">{totalEscaneos}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Escaneos realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección del Gráfico + Tarjeta de Promedio Diario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico (Toma 2 columnas) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Escaneos por Dia
            </CardTitle>
            <CardDescription>Ultimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {scansByDay.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay datos de escaneos
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scansByDay}>
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

        {/* 📈 TARJETA DE PROMEDIO DIARIO (Toma 1 columna) */}
        <Card className="col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-chart-1" />
              Rendimiento Diario
            </CardTitle>
            <CardDescription>Métrica de los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pb-8">
            <div className="text-center space-y-2">
              <p className="text-6xl font-black tracking-tight text-primary">
                {promedioDiario}
              </p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Escaneos / Día
              </p>
            </div>
            <div className="mt-6 w-full rounded-md bg-muted/50 p-3 text-xs text-muted-foreground text-center">
              Métrica calculada dinámicamente sobre el volumen de actividad reciente del sistema.
            </div>
          </CardContent>
        </Card>

      </div>

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