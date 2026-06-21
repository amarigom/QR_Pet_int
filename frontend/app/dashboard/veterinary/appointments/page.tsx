'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/app/context/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { AppointmentCard } from '@/components/veterinary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AppointmentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (user?.rol !== 'veterinario') {
      router.push('/dashboard')
      return
    }

    // TODO: Fetch appointments from API
    // const loadAppointments = async () => {
    //   try {
    //     const data = await veterinaryApi.getAppointments()
    //     setAppointments(data)
    //   } catch (error) {
    //     console.error('Error loading appointments:', error)
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // loadAppointments()

    setIsLoading(false)
  }, [user, router])

  const upcomingAppointments = appointments.filter(
    apt => new Date(apt.fecha_hora) > new Date() && apt.estado !== 'canceled'
  )

  const pastAppointments = appointments.filter(
    apt => new Date(apt.fecha_hora) <= new Date() || apt.estado === 'canceled'
  )

  const handleStatusChange = async (id: string, status: string) => {
    // TODO: Update appointment status
    console.log(`Updating appointment ${id} to status ${status}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            Citas Veterinarias
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona y confirma citas con dueños de mascotas</p>
        </div>
        <Link href="/dashboard/veterinary/appointments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Próximas ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Historial ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            <div className="grid gap-4">
              {upcomingAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No hay citas próximas</p>
                <Link href="/dashboard/veterinary/appointments/new">
                  <Button variant="outline">Crear Nueva Cita</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            <div className="grid gap-4">
              {pastAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No hay citas anteriores</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
