'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  MapPin,
  PawPrint,
  QrCode,
  RefreshCw,
  Stethoscope,
  Trash2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScanMapProvider } from '@/components/map/map-provider'
import { PaginationControls } from '@/components/dashboard/pagination-controls'
import { KnowledgeManager } from '@/components/dashboard/knowledge-manager'
import { useVeterinarianDashboard } from '@/hooks/useVeterinarianDashboard'
import { getApiOrigin } from '@/lib/api/client'
import type { User } from '@/lib/types/auth'
import type { VeterinarianPet } from '@/lib/types/veterinarian'

interface VeterinarianDashboardProps {
  user: User
}

function petLabel(pet: VeterinarianPet, clientName: string) {
  return `${pet.nombre} (${clientName})`
}

function displayDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-AR')
}

function dateOnly(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseAppointmentDate(value: string) {
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
}

function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

export default function VeterinarianDashboard({ user }: VeterinarianDashboardProps) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [qrSearch, setQrSearch] = useState('')
  const [qrPage, setQrPage] = useState(1)
  const qrPageSize = 10
  const {
    data,
    isLoading,
    isSubmitting,
    error,
    weeklyAppointments,
    appointmentsError,
    appointmentsRefreshVersion,
    createdClient,
    loadWeeklyAppointments,
    reload,
    createAppointment,
    createMedicalRecord,
    updateAppointmentStatus,
    deleteAppointment,
    createClient,
    resendClientActivation,
    uploadClinicLogo,
  } = useVeterinarianDashboard()

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + index)
      return date
    }),
    [weekStart],
  )
  const weekEnd = weekDays[6]

  useEffect(() => {
    const nextWeekStart = new Date(weekEnd)
    nextWeekStart.setDate(nextWeekStart.getDate() + 1)
    void loadWeeklyAppointments(weekStart.toISOString(), nextWeekStart.toISOString())
  }, [weekStart, weekEnd, appointmentsRefreshVersion, loadWeeklyAppointments])

  const linkedClientName = useMemo(
    () => new Map((data?.clients ?? []).map((client) => [client.id, client.nombre])),
    [data?.clients],
  )
  const availableClientName = useMemo(
    () => new Map((data?.available_clients ?? []).map((client) => [client.id, client.nombre])),
    [data?.available_clients],
  )
  const filteredQrs = useMemo(() => {
    const term = qrSearch.trim().toLocaleLowerCase()
    if (!term) return data?.qrs ?? []
    return (data?.qrs ?? []).filter((qr) => [
      qr.codigo,
      qr.mascota_nombre,
      qr.dueno_nombre,
    ].some((value) => value.toLocaleLowerCase().includes(term)))
  }, [data?.qrs, qrSearch])
  const visibleQrs = filteredQrs.slice((qrPage - 1) * qrPageSize, qrPage * qrPageSize)

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Cargando panel veterinario...</div>
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar el panel veterinario</CardTitle>
          <CardDescription>{error || 'El servidor no devolvió los datos del panel.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void reload()}>Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  const scansWithLocation = data.scans.filter(
    (scan) => scan.latitud != null && scan.longitud != null,
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Panel veterinario</h1>
        <p className="text-muted-foreground">Hola, {user.nombre}. Gestioná tus pacientes y consultas.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Clientes vinculados', value: data.clients.length, icon: Users },
          { label: 'Mascotas atendidas', value: data.pets.length, icon: PawPrint },
          { label: 'Códigos QR', value: data.qrs.length, icon: QrCode },
          { label: 'Escaneos', value: data.scans.length, icon: Activity },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              <Icon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="pets">Mascotas y QR</TabsTrigger>
          <TabsTrigger value="scans">Escaneos</TabsTrigger>
          <TabsTrigger value="appointments">Turnos</TabsTrigger>
          <TabsTrigger value="medical">Historias clínicas</TabsTrigger>
          <TabsTrigger value="knowledge">Conocimiento IA</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Identidad de la veterinaria</CardTitle>
                <CardDescription>
                  {data.clinic?.nombre_clinica || 'Perfil veterinario'}
                  {' · '}el logo se mostrará a tus clientes vinculados.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {data.clinic?.logo_url ? (
                  <img
                    src={`${getApiOrigin()}${data.clinic.logo_url}`}
                    alt={`Logo de ${data.clinic.nombre_clinica}`}
                    className="h-20 w-20 rounded-lg border object-contain p-1"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                    Sin logo
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="clinic-logo">Subir logo PNG, JPG o WebP (máx. 2 MB)</Label>
                  <Input
                    id="clinic-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0]
                      if (file) void uploadClinicLogo(file)
                      event.currentTarget.value = ''
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrar cliente</CardTitle>
                <CardDescription>
                  Le enviaremos por WhatsApp un enlace único para activar la cuenta y elegir una contraseña privada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createClient} className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="client-name">Nombre</Label>
                    <Input id="client-name" name="client-name" required maxLength={100} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="client-email">Correo</Label>
                    <Input id="client-email" name="client-email" type="email" required />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="client-phone">WhatsApp (formato internacional)</Label>
                    <Input id="client-phone" name="client-phone" type="tel" required placeholder="+5492494112233" pattern="^\+[1-9]\d{9,14}$" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="sm:col-span-2">
                    <Users className="mr-2 h-4 w-4" />
                    Crear cliente y enviar activación
                  </Button>
                </form>
                {createdClient?.activation_url && (
                  <div className="mt-4 space-y-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
                    <p>{createdClient.message}</p>
                    {createdClient.whatsapp_error && (
                      <p className="text-destructive">
                        Motivo informado por WhatsApp: {createdClient.whatsapp_error}
                      </p>
                    )}
                    <a
                      className="break-all font-medium text-primary underline"
                      href={createdClient.activation_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {createdClient.activation_url}
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const activationUrl = createdClient?.activation_url
                        if (activationUrl) void navigator.clipboard.writeText(activationUrl)
                      }}
                    >
                      Copiar enlace de activación
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Clientes vinculados</CardTitle>
              <CardDescription>
                Clientes que registraste o que ya tienen un turno o una consulta clínica contigo.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Mascotas</th>
                    <th className="p-3">Cuenta</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clients.map((client) => (
                    <tr key={client.id} className="border-b">
                      <td className="p-3 font-medium">{client.nombre}</td>
                      <td className="p-3">{client.email}</td>
                      <td className="p-3">{client.telefono || '—'}</td>
                      <td className="p-3">{client.mascotas_count}</td>
                      <td className="p-3">
                        {client.pending_activation ? 'Pendiente de activar' : 'Activa'}
                      </td>
                      <td className="p-3">
                        {client.pending_activation && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => void resendClientActivation(client.id)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reenviar activación
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.clients.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Todavía no tenés clientes vinculados. Registrá un cliente o iniciá el vínculo agendando un turno.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pets">
          <Card>
            <CardHeader>
              <CardTitle>Mascotas y códigos QR</CardTitle>
              <CardDescription>Solo se muestran mascotas relacionadas con tus turnos o historias clínicas.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Mascota</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Especie</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pets.map((pet) => (
                    <tr key={pet.id} className="border-b">
                      <td className="p-3 font-medium">{pet.nombre}</td>
                      <td className="p-3">{linkedClientName.get(pet.usuario_id) || '—'}</td>
                      <td className="p-3 capitalize">{pet.especie}</td>
                      <td className="p-3">{pet.estado}</td>
                      <td className="p-3">{pet.qr?.codigo || 'Sin QR'}</td>
                    </tr>
                  ))}
                  {data.pets.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Las mascotas aparecerán al crear un turno o una historia clínica.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>QR vinculados a tus pacientes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="mb-4 max-w-md">
                <Input
                  aria-label="Buscar códigos QR de pacientes"
                  placeholder="Buscar por código, mascota o cliente"
                  value={qrSearch}
                  onChange={(event) => {
                    setQrSearch(event.target.value)
                    setQrPage(1)
                  }}
                />
              </div>
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Código</th>
                    <th className="p-3">Mascota</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleQrs.map((qr) => (
                    <tr key={qr.id} className="border-b">
                      <td className="p-3 font-mono">{qr.codigo}</td>
                      <td className="p-3">{qr.mascota_nombre}</td>
                      <td className="p-3">{qr.dueno_nombre}</td>
                      <td className="p-3">{qr.activo ? 'Activo' : 'Inactivo'}</td>
                    </tr>
                  ))}
                  {filteredQrs.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No hay códigos QR que coincidan con la búsqueda.
                    </td></tr>
                  )}
                </tbody>
              </table>
              <PaginationControls
                page={qrPage}
                total={filteredQrs.length}
                pageSize={qrPageSize}
                onPageChange={setQrPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mapa de escaneos
                </CardTitle>
                <CardDescription>
                  Ubicaciones de escaneos QR de tus pacientes vinculados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScanMapProvider scans={data.scans} />
                {scansWithLocation.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay escaneos con coordenadas para mostrar marcadores. El mapa está centrado en Tandil.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escaneos recientes</CardTitle>
                <CardDescription>Actividad QR de tus pacientes vinculados, hasta 100 registros.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Mascota</th>
                      <th className="p-3">Código QR</th>
                      <th className="p-3">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.scans.map((scan) => (
                      <tr key={scan.id} className="border-b">
                        <td className="p-3">{displayDate(scan.created_at)}</td>
                        <td className="p-3">{scan.pet_name}</td>
                        <td className="p-3 font-mono">{scan.qr_codigo}</td>
                        <td className="p-3">{scan.direccion_aproximada || 'No disponible'}</td>
                      </tr>
                    ))}
                    {data.scans.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">
                        Todavía no hay escaneos de tus pacientes.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendar turno</CardTitle>
              <CardDescription>Elegí un cliente del catálogo y una de sus mascotas para iniciar el vínculo.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.available_pets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay clientes con mascotas para agendar.</p>
              ) : (
                <form onSubmit={createAppointment} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="appointment-pet">Cliente y mascota</Label>
                    <select id="appointment-pet" name="appointment-pet" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      {data.available_pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {petLabel(pet, availableClientName.get(pet.usuario_id) || 'Cliente')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-start">Inicio</Label>
                    <Input id="appointment-start" name="appointment-start" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-end">Fin</Label>
                    <Input id="appointment-end" name="appointment-end" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-service">Servicio</Label>
                    <Input id="appointment-service" name="appointment-service" maxLength={50} required placeholder="Consulta" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment-notes">Observaciones</Label>
                    <Input id="appointment-notes" name="appointment-notes" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="md:col-span-2">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Agendar turno
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Agenda semanal</CardTitle>
                <CardDescription>
                  {weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                  {' – '}
                  {weekEnd.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Semana anterior"
                  onClick={() => setWeekStart((current) => {
                    const previous = new Date(current)
                    previous.setDate(previous.getDate() - 7)
                    return previous
                  })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setWeekStart(mondayOf(new Date()))}>
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Semana siguiente"
                  onClick={() => setWeekStart((current) => {
                    const next = new Date(current)
                    next.setDate(next.getDate() + 7)
                    return next
                  })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {appointmentsError ? (
                <p role="alert" className="py-4 text-sm text-destructive">{appointmentsError}</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid min-w-[980px] grid-cols-7 divide-x rounded-md border">
                    {weekDays.map((day) => {
                      const dayKey = dateOnly(day)
                      const dayAppointments = weeklyAppointments.filter(
                        (appointment) => dateOnly(parseAppointmentDate(appointment.fecha_hora_inicio)) === dayKey,
                      )
                      return (
                        <section key={dayKey} className="min-h-56">
                          <h3 className="border-b bg-muted/40 p-3 text-center text-sm font-semibold capitalize">
                            {day.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </h3>
                          <div className="space-y-2 p-2">
                            {dayAppointments.map((appointment) => {
                              const pet = data.available_pets.find((item) => item.id === appointment.mascota_id)
                              const clientName = availableClientName.get(appointment.dueno_id || '') || 'Cliente'
                              return (
                                <article key={appointment.id} className="space-y-2 rounded-md border bg-card p-2 text-xs">
                                  <p className="font-semibold">
                                    {parseAppointmentDate(appointment.fecha_hora_inicio).toLocaleTimeString('es-AR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {' · '}{pet?.nombre || 'Mascota'}
                                  </p>
                                  <p className="text-muted-foreground">{clientName}</p>
                                  <p>{appointment.tipo_servicio}</p>
                                  <p className="text-muted-foreground">{appointment.estado}</p>
                                  {appointment.estado === 'PROGRAMADO' && (
                                    <div className="flex flex-wrap gap-1">
                                      <Button
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={isSubmitting}
                                        onClick={() => void updateAppointmentStatus(appointment.id, 'ATENDIDO')}
                                      >
                                        Atendido
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={isSubmitting}
                                        aria-label={`Eliminar turno de ${pet?.nombre || 'mascota'}`}
                                        onClick={() => {
                                          if (window.confirm('¿Eliminar este turno de la agenda? Se conservará como cancelado en el historial.')) {
                                            void deleteAppointment(appointment.id)
                                          }
                                        }}
                                      >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  )}
                                </article>
                              )
                            })}
                            {dayAppointments.length === 0 && (
                              <p className="py-4 text-center text-xs text-muted-foreground">Sin turnos</p>
                            )}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar consulta clínica</CardTitle>
              <CardDescription>Primero agendá un turno para esa mascota; así queda vinculada a tu práctica.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.pets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Agendá un turno para vincular una mascota antes de registrar su consulta.</p>
              ) : (
                <form onSubmit={createMedicalRecord} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="medical-pet">Mascota</Label>
                    <select id="medical-pet" name="medical-pet" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      {data.pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {petLabel(pet, linkedClientName.get(pet.usuario_id) || 'Cliente')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="medical-reason">Motivo de consulta</Label>
                    <Input id="medical-reason" name="medical-reason" minLength={3} maxLength={255} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical-diagnosis">Diagnóstico</Label>
                    <Textarea id="medical-diagnosis" name="medical-diagnosis" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical-treatment">Tratamiento</Label>
                    <Textarea id="medical-treatment" name="medical-treatment" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical-weight">Peso (kg)</Label>
                    <Input id="medical-weight" name="medical-weight" type="number" min="0" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical-temperature">Temperatura (°C)</Label>
                    <Input id="medical-temperature" name="medical-temperature" type="number" min="30" max="45" step="0.1" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="md:col-span-2">
                    <ClipboardPlus className="mr-2 h-4 w-4" />
                    Guardar historia clínica
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historias clínicas registradas</CardTitle>
              <CardDescription>Solo se muestran registros creados por tu cuenta veterinaria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.medical_records.map((record) => (
                <article key={record.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold">
                      {data.pets.find((pet) => pet.id === record.mascota_id)?.nombre || 'Mascota'} · {record.motivo_consulta}
                    </h3>
                    <time className="text-sm text-muted-foreground">{displayDate(record.fecha_consulta)}</time>
                  </div>
                  {record.diagnostico && <p className="mt-2 text-sm"><strong>Diagnóstico:</strong> {record.diagnostico}</p>}
                  {record.tratamiento && <p className="mt-1 text-sm"><strong>Tratamiento:</strong> {record.tratamiento}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.peso_kg != null ? `Peso: ${record.peso_kg} kg` : ''}
                    {record.peso_kg != null && record.temperatura_c != null ? ' · ' : ''}
                    {record.temperatura_c != null ? `Temperatura: ${record.temperatura_c} °C` : ''}
                  </p>
                </article>
              ))}
              {data.medical_records.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">Todavía no hay historias clínicas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeManager audience="veterinarian" vectorizeMedicalHistories />
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-5 text-sm text-muted-foreground">
          <Stethoscope className="h-5 w-5 shrink-0 text-primary" />
          Los clientes se vinculan al veterinario mediante sus turnos; los registros médicos solo son visibles para el profesional que los creó.
        </CardContent>
      </Card>
    </div>
  )
}
