'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

interface ClinicCardProps {
  clinic: {
    id: string
    nombre: string
    direccion: string
    ciudad: string
    telefono?: string
    email?: string
    latitud?: number
    longitud?: number
  }
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{clinic.nombre}</CardTitle>
              <CardDescription className="mt-1">{clinic.ciudad}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          {clinic.direccion && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{clinic.direccion}</span>
            </div>
          )}
          {clinic.telefono && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{clinic.telefono}</span>
            </div>
          )}
          {clinic.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{clinic.email}</span>
            </div>
          )}
        </div>
        <div className="pt-2 flex gap-2">
          <Link href={`/dashboard/veterinary/clinic/${clinic.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Ver Detalles
            </Button>
          </Link>
          <Link href={`/dashboard/veterinary/clinic/${clinic.id}/edit`}>
            <Button variant="ghost">Editar</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
