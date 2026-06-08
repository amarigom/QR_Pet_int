
'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PawPrint, QrCode, MapPin, Eye, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

// Definimos la interfaz exacta de la data unificada que inyecta el Padre
interface AdminDashboardProps {
  user: any
  data: {
    summary: {
      pets_count: number
      qrs_count: number
      total_scans: number
    }
    allPets: any[]
    recent_scans?: any[]
  }
}

export default function AdminDashboard({ user, data }: AdminDashboardProps) {
    // 🎯 RED DE SEGURIDAD MÁXIMA PARA QA:
    // Si la API falla o devuelve nulos, los cortocircuitos (||) evitan pantallas en blanco.
    const stats = data?.summary || { pets_count: 0, qrs_count: 0, total_scans: 0 }
    const allPets = data?.allPets || []
    const recentScans = data?.recent_scans || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    Dashboard 
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Admin</span>
                </h1>
                <p className="text-muted-foreground">Consola de Control • Bienvenido, {user?.nombre || user?.email}</p>
            </div>

            {/* Estadísticas de control global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-primary/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mascotas en la Plataforma</CardTitle>
                        <PawPrint className="w-5 h-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-primary">{stats.pets_count}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total QRs Emitidos</CardTitle>
                        <QrCode className="w-5 h-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.qrs_count}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Métricas de Escaneo Global</CardTitle>
                        <Eye className="w-5 h-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.total_scans}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gestión de todas las mascotas */}
            <Card>
                <CardHeader>
                    <CardTitle>Gestión Global de Mascotas</CardTitle>
                    <CardDescription>Vista maestra para auditoría de registros de usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                    {allPets.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground text-sm">No hay mascotas registradas en el sistema global.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allPets.map((pet) => (
                                <Link key={pet.id} href={`/admin/pets/${pet.id}`}>
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border">
                                                    {pet.foto_url ? (
                                                        <img src={pet.foto_url} alt={pet.nombre} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <PawPrint className="w-8 h-8 text-muted-foreground/40" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg truncate">{pet.nombre}</h3>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {/* Se simplifica el manejo para evitar caídas de ID */}
                                                        Dueño: {pet.owner_name || pet.usuario_id || 'No asignado'}
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

            {/* Monitoreo en tiempo real de escaneos */}
            {recentScans.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="w-5 h-5 text-destructive" />
                            Alertas y Actividad en Tiempo Real
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {recentScans.map((scan) => (
                                <div key={scan.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">Mascota: {scan.pet_name || 'Desconocido'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{scan.direccion_aproximada || "Sin GPS directo"}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatDateTime(scan.escaneado_en || scan.created_at)}
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