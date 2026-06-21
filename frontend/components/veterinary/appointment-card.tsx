'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, PawPrint, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentCardProps {
  appointment: {
    id: string
    fecha_hora: string
    tipo_consulta: string
    duracion_minutos: number
    estado: 'pending' | 'confirmed' | 'completed' | 'canceled'
    pet?: {
      nombre: string
    }
    owner?: {
      nombre: string
    }
  }
  onStatusChange?: (id: string, status: string) => void
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
}

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  canceled: 'Cancelada',
}

export function AppointmentCard({ appointment, onStatusChange }: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.fecha_hora)
  const isUpcoming = appointmentDate > new Date()
  const isCompleted = appointment.estado === 'completed'

  return (
    <Card className={`transition-opacity ${isCompleted ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {appointment.tipo_consulta}
            </CardTitle>
            <CardDescription className="mt-1">
              {format(appointmentDate, "PPP 'a las' p", { locale: es })}
            </CardDescription>
          </div>
          <Badge className={statusColors[appointment.estado]}>
            {statusLabels[appointment.estado]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          {appointment.pet && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <PawPrint className="w-4 h-4" />
              <span>{appointment.pet.nombre}</span>
            </div>
          )}
          {appointment.owner && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{appointment.owner.nombre}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{appointment.duracion_minutos} minutos</span>
          </div>
        </div>
        <div className="pt-2 flex gap-2">
          <Link href={`/dashboard/veterinary/appointments/${appointment.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Ver Detalles
            </Button>
          </Link>
          {isUpcoming && appointment.estado === 'pending' && onStatusChange && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onStatusChange(appointment.id, 'confirmed')}
            >
              Confirmar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
