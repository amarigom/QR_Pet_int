'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PawPrint, Calendar, Pill } from 'lucide-react'
import Link from 'next/link'

interface PetMedicalCardProps {
  pet: {
    id: string
    nombre: string
    especie: string
    raza?: string
    edad?: number
    foto_url?: string
  }
  stats?: {
    medical_records_count: number
    vaccines_count: number
    appointments_count: number
  }
}

export function PetMedicalCard({ pet, stats }: PetMedicalCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-primary" />
              {pet.nombre}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {pet.especie}{pet.raza ? ` • ${pet.raza}` : ''}{pet.edad ? ` • ${pet.edad} años` : ''}
            </CardDescription>
          </div>
          {pet.foto_url && (
            <img
              src={pet.foto_url}
              alt={pet.nombre}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary/5 rounded p-2 text-center">
              <div className="text-lg font-semibold">{stats.medical_records_count}</div>
              <div className="text-xs text-muted-foreground">Consultas</div>
            </div>
            <div className="bg-primary/5 rounded p-2 text-center">
              <div className="text-lg font-semibold">{stats.vaccines_count}</div>
              <div className="text-xs text-muted-foreground">Vacunas</div>
            </div>
            <div className="bg-primary/5 rounded p-2 text-center">
              <div className="text-lg font-semibold">{stats.appointments_count}</div>
              <div className="text-xs text-muted-foreground">Citas</div>
            </div>
          </div>
        )}
        <Link href={`/dashboard/veterinary/pets/${pet.id}`} className="block">
          <Button className="w-full" variant="default" size="sm">
            Ver Historial Médico
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
