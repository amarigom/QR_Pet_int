
'use client'

import React from 'react'
import Link from 'next/link'
import { PawPrint, QrCode, PlusCircle, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserDashboardData, PetData } from '@/lib/types/dashboard'

// Importación del nuevo mapa unificado y optimizado
import { ScanMapProvider } from '@/components/map/map-provider'

interface UserDashboardProps {
  data: UserDashboardData
  user: any
}

export default function UserDashboard({ data }: UserDashboardProps) {
  // Red de seguridad de QA contra nulos o respuestas inesperadas de la API
  const pets = data?.pets || []
  const summary = data?.summary || { total_pets: 0, active_qrs: 0 }
  
  // Extraemos los escaneos del payload (ajusta la propiedad según cómo la envíe tu backend, ej: data.recent_scans)
  // @ts-ignore - Ajuste temporal hasta mapear el tipo exacto en UserDashboardData
  const misScans = data?.recent_scans || data?.scans || []

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi Panel</h1>
          <p className="text-muted-foreground text-sm">
            Gestioná tus mascotas y controlá el estado de tus códigos QR.
          </p>
        </div>
        <Link href="/dashboard/activate" passHref>
          <Button className="flex items-center gap-2 w-full sm:w-auto shadow-sm">
            <PlusCircle className="w-4 h-4" />
            Activar nuevo QR
          </Button>
        </Link>
      </div>

      {/* SECCIÓN DE CONTADORES (Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mascotas Registradas
            </CardTitle>
            <PawPrint className="w-5 h-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{summary.total_pets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total_pets === 1 ? '1 mascota protegida' : `${summary.total_pets} mascotas protegidas`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Códigos QR Activos
            </CardTitle>
            <QrCode className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-emerald-600">
              {summary.active_qrs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chapitas vinculadas y operativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🗺️ SECCIÓN DEL MAPA DE ESCANEOS RECIENTES */}
      <Card className="border-muted/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Ubicaciones de Escaneo
          </CardTitle>
          <CardDescription>
            Últimos lugares reportados donde las personas escanearon las chapitas de tus mascotas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* El Provider se encarga del lazy loading y evita que falle en SSR/Vercel */}
          <div className="rounded-lg overflow-hidden border bg-card">
            <ScanMapProvider scans={misScans} />
          </div>
        </CardContent>
      </Card>

      {/* 🐾 GRILLA DE MASCOTAS */}
      <Card className="border-muted/60 shadow-sm">
        <CardHeader>
          <CardTitle>Mis Mascotas</CardTitle>
          <CardDescription>
            Hacé clic en cualquier tarjeta para ver su perfil, historial de escaneos y editar sus datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No hay mascotas registradas</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">
                Comenzá activando un código QR para vincular tu primer perfil.
              </p>
              <Link href="/dashboard/activate" passHref>
                <Button variant="outline">Activar mi primer QR</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet: PetData) => {
                const tieneFotoValida = pet.foto_url && pet.foto_url !== 'string' && pet.foto_url.trim() !== ''

                return (
                  <Link key={pet.id} href={`/dashboard/pets/${pet.id}`} passHref>
                    <Card className="hover:shadow-md transition-all hover:border-primary/40 cursor-pointer h-full border-muted/60 flex flex-col justify-between group bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-16 h-16 rounded-lg border bg-muted/40 shrink-0">
                            {tieneFotoValida ? (
                              <AvatarImage 
                                src={pet.foto_url} 
                                alt={pet.nombre} 
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-primary/5">
                              <PawPrint className="w-7 h-7 text-primary/40 group-hover:scale-110 transition-transform" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="font-bold text-base leading-none truncate text-foreground group-hover:text-primary transition-colors">
                              {pet.nombre}
                            </h3>
                            <p className="text-xs text-muted-foreground capitalize truncate">
                              {pet.especie} {pet.raza && `• ${pet.raza}`}
                            </p>
                            
                            {pet.qr && (
                              <div className="pt-0.5">
                                <Badge variant="outline" className="font-mono text-[10px] tracking-tight bg-background px-1.5 py-0">
                                  QR: {pet.qr.codigo}
                                </Badge>
                              </div>
                            )}
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
    </div>
  )
}