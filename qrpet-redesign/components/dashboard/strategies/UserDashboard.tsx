
'use client'

import React from 'react'
import Link from 'next/link'
import { PawPrint, QrCode, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { UserDashboardData,PetData } from '@/lib/types/dashboard' // Tu archivo de tipos

interface UserDashboardProps {
  data: UserDashboardData
  user: any
};

export default function UserDashboard({ data }: UserDashboardProps) {
  // 🎯 Red de seguridad de QA contra nulos o respuestas inesperadas de la API
  const pets = data?.pets || []
  const summary = data?.summary || { total_pets: 0, active_qrs: 0 }

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
        {/* Botón rápido de acción por si quieren activar otro QR */}
        <Link href="/dashboard/activate">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <PlusCircle className="w-4 h-4" />
            Activar nuevo QR
          </Button>
        </Link>
      </div>

      {/* 📊 SECCIÓN DE CONTADORES (Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta 1: Total de Mascotas */}
        <Card className="border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mascotas Registradas
            </CardTitle>
            <PawPrint className="w-5 h-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total_pets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total_pets === 1 ? '1 mascota protegida' : `${summary.total_pets} mascotas protegidas`}
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 2: QRs Activos */}
        <Card className="border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Códigos QR Activos
            </CardTitle>
            <QrCode className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {summary.active_qrs}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chapitas vinculadas y operativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🐾 GRILLA DE MASCOTAS */}
      <Card className="border-muted/60">
        <CardHeader>
          <CardTitle>Mis Mascotas</CardTitle>
          <CardDescription>
            Hacé clic en cualquier tarjeta para ver su perfil, historial de escaneos y editar sus datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <PawPrint className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay mascotas registradas</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Comenzá activando un código QR para tu mascota.
              </p>
              <Link href="/dashboard/activate">
                <Button variant="outline">Activar mi primer QR</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet: PetData) => (
                <Link key={pet.id} href={`/dashboard/pets/${pet.id}`}>
                  <Card className="hover:shadow-md transition-all hover:border-primary/40 cursor-pointer h-full border-muted/60 flex flex-col justify-between">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden border">
                          {pet.foto_url ? (
                            <img 
                              src={pet.foto_url} 
                              alt={pet.nombre} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <PawPrint className="w-8 h-8 text-primary/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate text-foreground">
                            {pet.nombre}
                          </h3>
                          <p className="text-sm text-muted-foreground capitalize truncate">
                            {pet.especie} {pet.raza && `• ${pet.raza}`}
                          </p>
                          {pet.qr && (
                            <span className="inline-block mt-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono border">
                              QR: {pet.qr.codigo}
                            </span>
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
    </div>
  )
}