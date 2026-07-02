
'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PawPrint, QrCode, MapPin, Eye, Clock, Map } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import DireccionInversa from '@/components/direccion-inversa'

// Importamos tus interfaces reales alineadas con el backend
import type { ScanWithLocation } from '@/lib/types'

// Importación del mapa unificado y optimizado
import { ScanMapProvider } from '@/components/map/map-provider'

interface AdminDashboardProps {
  user: any
  data: {
    summary: {
      pets_count: number
      qrs_count: number
      total_scans: number
    }
    allPets: any[]
    recent_scans?: ScanWithLocation[]
  }
}

export default function AdminDashboard({ user, data }: AdminDashboardProps) {
  // RED DE SEGURIDAD MÁXIMA PARA QA:
  const stats = data?.summary || { pets_count: 0, qrs_count: 0, total_scans: 0 }
  const allPets = data?.allPets || []
  const recentScans: ScanWithLocation[] = data?.recent_scans || []
  console.log("🔍 QA AUDIT - RECENT SCANS:", recentScans)
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      
      {/* Encabezado del Dashboard */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
          Dashboard 
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
            Admin
          </span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Consola de Control • Bienvenido, {user?.nombre || user?.email}
        </p>
      </div>

      {/* SECCIÓN DE CONTADORES (Estadísticas Globales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mascotas en la Plataforma</CardTitle>
            <PawPrint className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary tracking-tight">{stats.pets_count}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total QRs Emitidos</CardTitle>
            <QrCode className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{stats.qrs_count}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Métricas de Escaneo Global</CardTitle>
            <Eye className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{stats.total_scans}</p>
          </CardContent>
        </Card>
      </div>

      {/* MAPA GLOBAL DE AUDITORÍA (Se muestra si hay escaneos con GPS) */}
      {recentScans.length > 0 && (() => {
        // 🛡️ Filtramos y preparamos los datos tipados de forma segura para el mapa
        const scansParaMapa = recentScans
          .map((scan: ScanWithLocation) => {
            const lat = scan.latitud != null ? Number(scan.latitud) : null;
            const lng = scan.longitud != null ? Number(scan.longitud) : null;

            return {
              ...scan,
              id: String(scan.id ?? Math.random()),
              latitud: lat,
              longitud: lng,
              mascota_nombre: scan.pet_name || "Mascota",
              direccion_aproximada: scan.direccion_aproximada || "Ubicación aproximada",
              created_at: scan.escaneado_en || null, 
              qr_codigo: scan.qr_codigo || "N/A" // 🎯 Sincronizado con el campo QR real
            };
          })
          .filter((s) => s.latitud !== null && s.longitud !== null);

        if (scansParaMapa.length === 0) return null;

        return (
          <Card className="border-muted/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" /> Mapa de Monitoreo Global
              </CardTitle>
              <CardDescription>
                Geolocalización en tiempo real de todos los escaneos registrados en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[400px] rounded-xl border bg-card overflow-hidden z-0">
                <ScanMapProvider scans={scansParaMapa} isAdmin={true} />
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* GESTIÓN DE TODAS LAS MASCOTAS */}
      <Card className="shadow-sm border-muted/60">
        <CardHeader>
          <CardTitle>Gestión Global de Mascotas</CardTitle>
          <CardDescription>Vista maestra para auditoría de registros de usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          {allPets.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">
              No hay mascotas registradas en el sistema global.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPets.map((pet) => {
                const tieneFotoValida = pet.foto_url && pet.foto_url !== 'string' && pet.foto_url.trim() !== ''

                return (
                  <Link key={pet.id} href={`/admin/pets/${pet.id}`} passHref>
                    <Card className="hover:border-primary/50 transition-all hover:shadow-sm cursor-pointer h-full border-muted/60 group bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16 rounded-lg border bg-muted/40 shrink-0">
                            {tieneFotoValida ? (
                              <AvatarImage src={pet.foto_url} alt={pet.nombre} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-primary/5">
                              <PawPrint className="w-7 h-7 text-primary/40 group-hover:scale-105 transition-transform" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                              {pet.nombre}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Dueño: <span className="font-medium text-foreground/80">{pet.owner_name || pet.usuario_id || 'No asignado'}</span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ALERTAS EN TIEMPO REAL (Lista detallada con desempate por QR y fechas históricas) */}
      {recentScans.length > 0 && (
        <Card className="shadow-sm border-muted/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-destructive" />
              Alertas y Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">
                        Mascota: <span className="text-primary">{scan.pet_name || 'Desconocido'}</span>
                      </p>
                      {/* 🎯 SECCIÓN COMPENSATORIA: Rótulo con el código QR para auditoría visual directa */}
                      <span className="text-[11px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold tracking-wider">
                        QR: {scan.qr_codigo || 'N/A'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {/* 🎯 Filtrado exhaustivo de textos por defecto antes de recurrir a la geolocalización inversa */}
                      {scan.direccion_aproximada && 
                       scan.direccion_aproximada !== "Ubicación aproximada" && 
                       scan.direccion_aproximada !== "Sin direccion aproximada" &&
                       scan.direccion_aproximada !== "Sin dirección registrada" ? (
                        <span className="truncate">{scan.direccion_aproximada}</span>
                      ) : (
                        <DireccionInversa lat={scan.latitud} lng={scan.longitud} />
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end font-medium">
                      {/* 🎯 Sincronizado nativamente con scan.escaneado_en del backend real */}
                      <Clock className="w-3 h-3" /> {scan.escaneado_en ? formatDateTime(scan.escaneado_en) : 'Sin fecha'}
                    </span>
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