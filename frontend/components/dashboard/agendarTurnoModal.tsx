'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Plus, Loader2, PawPrint } from 'lucide-react'
import { toast } from 'sonner'
import { turnosApi } from '@/lib/api/turnos'

interface AgendarTurnoModalProps {
  onTurnoCreado?: () => void
  mascotas?: Array<{ id: string; nombre: string }>
}

export default function AgendarTurnoModal({ onTurnoCreado, mascotas = [] }: AgendarTurnoModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Estados del formulario
  const [mascotaId, setMascotaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mascotaId || !fecha || !hora || !motivo.trim()) {
      toast.error('Por favor, completa todos los campos requeridos.')
      return
    }

    // Unificamos Fecha (YYYY-MM-DD) y Hora (HH:MM) en formato ISO string (YYYY-MM-DDTHH:mm:ss)
    const fechaHoraISO = new Date(`${fecha}T${hora}:00`).toISOString()

    setLoading(true)
    try {
      await turnosApi.agendarTurno({
        mascota_id: mascotaId,
        fecha: fechaHoraISO,
        motivo: motivo.trim(),
      })

      toast.success('¡Turno agendado exitosamente!')
      setOpen(false)
      
      // Limpiar formulario
      setMascotaId('')
      setFecha('')
      setHora('')
      setMotivo('')

      // Callback para refrescar la lista en la pantalla principal
      if (onTurnoCreado) {
        onTurnoCreado()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agendar el turno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Turno
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Agendar Nuevo Turno
          </DialogTitle>
          <DialogDescription>
            Ingresa los datos de la mascota, la fecha de atención y el motivo de la consulta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* Selección o UUID de la Mascota */}
          <div className="space-y-2">
            <Label htmlFor="mascotaId">ID o Selección de Mascota *</Label>
            {mascotas.length > 0 ? (
              <select
                id="mascotaId"
                value={mascotaId}
                onChange={(e) => setMascotaId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccionar mascota...</option>
                {mascotas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="mascotaId"
                  placeholder="Ej: 550e8400-e29b-41d4-a716-446655440000"
                  value={mascotaId}
                  onChange={(e) => setMascotaId(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            )}
          </div>

          {/* Fecha y Hora de la atención */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <div className="relative">
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <div className="relative">
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Motivo de la consulta */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la Consulta *</Label>
            <Textarea
              id="motivo"
              placeholder="Ej: Control de rutina, vacunación quíntuple o revisión por malestar..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Confirmar Turno'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}