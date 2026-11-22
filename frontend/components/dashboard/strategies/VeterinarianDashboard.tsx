'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Copy,
  FilePlus2,
  FlaskConical,
  MapPin,
  PawPrint,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  Users,
  X,
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
import { ClinicalStudiesSection } from '@/components/clinical-studies-section'
import { useVeterinarianDashboard } from '@/hooks/useVeterinarianDashboard'
import { getApiAssetUrl } from '@/lib/api/client'
import type { User } from '@/lib/types/auth'
import type { DiagnosticPetLookupItem, VeterinarianPet } from '@/lib/types/veterinarian'

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
  const [mobileAgendaDayIndex, setMobileAgendaDayIndex] = useState(
    () => (new Date().getDay() + 6) % 7,
  )

  // Controles minimalistas de UI (paneles colapsables bajo demanda)
  const [showClinicSettings, setShowClinicSettings] = useState(false)
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false)
  const [patientsSubView, setPatientsSubView] = useState<'linked' | 'diagnostic'>('linked')
  const [selectedLinkedPetId, setSelectedLinkedPetId] = useState<string>('')
  const [showNewConsultationForm, setShowNewConsultationForm] = useState(false)

  // Recepción de estudios / derivaciones
  const [diagnosticMode, setDiagnosticMode] = useState<'lookup' | 'express'>('lookup')
  const [diagnosticQuery, setDiagnosticQuery] = useState('')
  const [selectedExternalPet, setSelectedExternalPet] = useState<DiagnosticPetLookupItem | null>(null)
  const [copiedActivationUrl, setCopiedActivationUrl] = useState(false)

  // Medallas y rastreo
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
    diagnosticLookupResults,
    isSearchingDiagnosticPet,
    altaExpressResult,
    loadWeeklyAppointments,
    reload,
    createAppointment,
    createMedicalRecord,
    updateAppointmentStatus,
    deleteAppointment,
    createClient,
    resendClientActivation,
    uploadClinicLogo,
    searchPetForStudy,
    registerAltaExpress,
    clearAltaExpressResult,
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
  const mobileAgendaDay = weekDays[mobileAgendaDayIndex] ?? weekDays[0]

  useEffect(() => {
    const nextWeekStart = new Date(weekEnd)
    nextWeekStart.setDate(nextWeekStart.getDate() + 1)
    void loadWeeklyAppointments(weekStart.toISOString(), nextWeekStart.toISOString())
  }, [weekStart, weekEnd, appointmentsRefreshVersion, loadWeeklyAppointments])

  useEffect(() => {
    const showConfirmedAppointment = (event: Event) => {
      const dateValue = (event as CustomEvent<{ fecha_hora_inicio?: string | null }>).detail
        ?.fecha_hora_inicio
      if (!dateValue) return
      const appointmentDate = parseAppointmentDate(dateValue)
      if (Number.isNaN(appointmentDate.getTime())) return
      setWeekStart(mondayOf(appointmentDate))
      setMobileAgendaDayIndex((appointmentDate.getDay() + 6) % 7)
    }
    window.addEventListener('veterinarian-data-refresh', showConfirmedAppointment)
    return () => window.removeEventListener('veterinarian-data-refresh', showConfirmedAppointment)
  }, [])

  // Seleccionar automáticamente el primer paciente vinculado disponible
  useEffect(() => {
    if (!selectedLinkedPetId && data?.pets && data.pets.length > 0) {
      setSelectedLinkedPetId(data.pets[0].id)
    }
  }, [data?.pets, selectedLinkedPetId])

  const linkedClientName = useMemo(
    () => new Map((data?.clients ?? []).map((client) => [client.id, client.nombre])),
    [data?.clients],
  )
  const availableClientName = useMemo(
    () => new Map((data?.available_clients ?? []).map((client) => [client.id, client.nombre])),
    [data?.available_clients],
  )

  // Filtrar solo medallas físicas en la vista de Medallas y Rastreo
  const physicalQrs = useMemo(
    () => (data?.qrs ?? []).filter((qr) => (qr as { tipo?: string }).tipo !== 'CLINICO'),
    [data?.qrs],
  )

  const filteredQrs = useMemo(() => {
    const term = qrSearch.trim().toLocaleLowerCase()
    if (!term) return physicalQrs
    return physicalQrs.filter((qr) => [
      qr.codigo,
      qr.mascota_nombre,
      qr.dueno_nombre,
    ].some((value) => value.toLocaleLowerCase().includes(term)))
  }, [physicalQrs, qrSearch])

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

  const todayKey = dateOnly(new Date())
  const todayAppointmentsCount = weeklyAppointments.filter(
    (appointment) =>
      appointment.estado === 'PROGRAMADO' &&
      dateOnly(parseAppointmentDate(appointment.fecha_hora_inicio)) === todayKey,
  ).length

  const selectedLinkedPet = data.pets.find((p) => p.id === selectedLinkedPetId) ?? null
  const selectedLinkedPetRecords = data.medical_records.filter(
    (record) => record.mascota_id === selectedLinkedPetId,
  )

  const scansWithLocation = data.scans.filter(
    (scan) => scan.latitud != null && scan.longitud != null,
  )

  // Mascota activa en el flujo de Recepción de Estudios (encontrada o recién creada en Alta Express)
  const activeDiagnosticPet = altaExpressResult
    ? {
        id: altaExpressResult.pet_id,
        nombre: altaExpressResult.pet_nombre,
        especie: altaExpressResult.pet_especie,
        ownerName: altaExpressResult.owner_nombre,
        qrCodigo: altaExpressResult.qr_codigo,
        qrTipo: altaExpressResult.qr_tipo,
      }
    : selectedExternalPet
      ? {
          id: selectedExternalPet.pet_id,
          nombre: selectedExternalPet.pet_name,
          especie: selectedExternalPet.especie,
          ownerName: selectedExternalPet.owner_name,
          qrCodigo: selectedExternalPet.qr_codigo || null,
          qrTipo: selectedExternalPet.qr_tipo || null,
        }
      : null

  return (
    <div className="flex flex-col gap-6">
      {/* Header minimalista + acceso discreto a configuración de clínica y clientes */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data.clinic?.nombre_clinica || 'Panel veterinario'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Hola, {user.nombre}. Gestioná tu agenda, pacientes y estudios clínicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-2 text-sm">
            <div>
              <span className="text-muted-foreground">Turnos hoy: </span>
              <strong className="font-semibold">{todayAppointmentsCount}</strong>
            </div>
            <span className="text-border">|</span>
            <div>
              <span className="text-muted-foreground">Pacientes: </span>
              <strong className="font-semibold">{data.pets.length}</strong>
            </div>
            <span className="text-border">|</span>
            <div>
              <span className="text-muted-foreground">Medallas: </span>
              <strong className="font-semibold">{physicalQrs.length}</strong>
            </div>
          </div>

          <Button
            type="button"
            variant={showClinicSettings ? 'secondary' : 'outline'}
            onClick={() => setShowClinicSettings((prev) => !prev)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            {showClinicSettings ? 'Cerrar configuración' : 'Mi Clínica y Clientes'}
          </Button>
        </div>
      </header>

      {/* Cajón colapsable de administración (Logo, Clientes vinculados y Conocimiento IA) */}
      {showClinicSettings && (
        <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Administración de la Clínica y Clientes</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar panel de clínica"
              onClick={() => setShowClinicSettings(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identidad institucional</CardTitle>
                <CardDescription>
                  El logo se mostrará a tus clientes vinculados en su aplicación.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {data.clinic?.logo_url ? (
                  <img
                    key={data.clinic.logo_url}
                    src={getApiAssetUrl(data.clinic.logo_url)}
                    alt={`Logo de ${data.clinic.nombre_clinica}`}
                    className="h-16 w-16 rounded-lg border object-contain p-1"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                    Sin logo
                  </div>
                )}
                <div className="space-y-1.5">
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
                <CardTitle className="text-base">Registrar cliente habitual</CardTitle>
                <CardDescription>
                  Envía por WhatsApp un enlace para activar su cuenta con contraseña privada.
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
                    <Input
                      id="client-phone"
                      name="client-phone"
                      type="tel"
                      required
                      placeholder="+5492494112233"
                      pattern="^\+[1-9]\d{9,14}$"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="sm:col-span-2">
                    <Users className="mr-2 h-4 w-4" />
                    Crear cliente y enviar activación
                  </Button>
                </form>

                {createdClient?.activation_url && (
                  <div className="mt-3 space-y-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
                    <p>{createdClient.message}</p>
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
                        if (createdClient.activation_url) {
                          void navigator.clipboard.writeText(createdClient.activation_url)
                        }
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
              <CardTitle className="text-base">Clientes vinculados ({data.clients.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2.5">Nombre</th>
                    <th className="p-2.5">Correo</th>
                    <th className="p-2.5">Teléfono</th>
                    <th className="p-2.5">Mascotas</th>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clients.map((client) => (
                    <tr key={client.id} className="border-b">
                      <td className="p-2.5 font-medium">{client.nombre}</td>
                      <td className="p-2.5">{client.email}</td>
                      <td className="p-2.5">{client.telefono || '—'}</td>
                      <td className="p-2.5">{client.mascotas_count}</td>
                      <td className="p-2.5">
                        {client.pending_activation ? 'Pendiente de activar' : 'Activa'}
                      </td>
                      <td className="p-2.5">
                        {client.pending_activation && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => void resendClientActivation(client.id)}
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Reenviar activación
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.clients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        Todavía no tenés clientes vinculados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <KnowledgeManager audience="veterinarian" vectorizeMedicalHistories />
        </section>
      )}

      {/* Navegación principal minimalista: 3 espacios claros */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto sm:w-fit">
          <TabsTrigger className="min-h-10 gap-2 px-4 text-sm font-medium" value="appointments">
            <CalendarDays className="h-4 w-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 px-4 text-sm font-medium" value="patients">
            <Stethoscope className="h-4 w-4" />
            Pacientes y Estudios
          </TabsTrigger>
          <TabsTrigger className="min-h-10 gap-2 px-4 text-sm font-medium" value="tracking">
            <QrCode className="h-4 w-4" />
            Medallas y Rastreo
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AGENDA */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>
                  <span className="sm:hidden">Turnos del día</span>
                  <span className="hidden sm:inline">Agenda semanal</span>
                </CardTitle>
                <CardDescription className="sm:hidden">
                  {mobileAgendaDay.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardDescription>
                <CardDescription className="hidden sm:block">
                  {weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                  {' – '}
                  {weekEnd.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setShowNewAppointmentForm((prev) => !prev)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {showNewAppointmentForm ? 'Cerrar formulario' : 'Nuevo turno'}
                </Button>
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

            {showNewAppointmentForm && (
              <CardContent className="border-t bg-muted/20 pt-4">
                {data.available_pets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay clientes con mascotas registradas para agendar un turno.
                  </p>
                ) : (
                  <form
                    onSubmit={async (event) => {
                      await createAppointment(event)
                      setShowNewAppointmentForm(false)
                    }}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="appointment-pet">Cliente y mascota</Label>
                      <select
                        id="appointment-pet"
                        name="appointment-pet"
                        required
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        {data.available_pets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {petLabel(pet, availableClientName.get(pet.usuario_id) || 'Cliente')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="appointment-start">Inicio</Label>
                      <Input id="appointment-start" name="appointment-start" type="datetime-local" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="appointment-end">Fin</Label>
                      <Input id="appointment-end" name="appointment-end" type="datetime-local" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="appointment-service">Servicio</Label>
                      <Input id="appointment-service" name="appointment-service" maxLength={50} required placeholder="Consulta general" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="appointment-notes">Observaciones</Label>
                      <Input id="appointment-notes" name="appointment-notes" />
                    </div>
                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowNewAppointmentForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        Confirmar turno
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            )}

            <CardContent className={showNewAppointmentForm ? 'border-t pt-4' : ''}>
              {appointmentsError ? (
                <p role="alert" className="py-4 text-sm text-destructive">{appointmentsError}</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid min-w-0 grid-cols-1 divide-x rounded-md border sm:min-w-[980px] sm:grid-cols-7">
                    {weekDays.map((day) => {
                      const dayKey = dateOnly(day)
                      const dayAppointments = weeklyAppointments.filter(
                        (appointment) => dateOnly(parseAppointmentDate(appointment.fecha_hora_inicio)) === dayKey,
                      )
                      const isMobileAgendaDay = day.getDay() === mobileAgendaDay.getDay()
                      return (
                        <section
                          key={dayKey}
                          className={isMobileAgendaDay ? 'min-h-64' : 'hidden min-h-64 sm:block'}
                        >
                          <h3 className="border-b bg-muted/40 p-2.5 text-center text-sm font-semibold capitalize">
                            {day.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </h3>
                          <div className="space-y-2 p-2">
                            {dayAppointments.map((appointment) => {
                              const pet = data.available_pets.find((item) => item.id === appointment.mascota_id)
                              const clientName = availableClientName.get(appointment.dueno_id || '') || 'Cliente'
                              return (
                                <article key={appointment.id} className="space-y-1.5 rounded-md border bg-card p-2.5 text-xs shadow-xs">
                                  <p className="font-semibold">
                                    {parseAppointmentDate(appointment.fecha_hora_inicio).toLocaleTimeString('es-AR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {' · '}{pet?.nombre || 'Mascota'}
                                  </p>
                                  <p className="text-muted-foreground">{clientName}</p>
                                  <p>{appointment.tipo_servicio}</p>
                                  <p className="text-[11px] font-medium text-muted-foreground">{appointment.estado}</p>
                                  {appointment.estado === 'PROGRAMADO' && (
                                    <div className="flex flex-wrap gap-1 pt-1">
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
                              <p className="py-6 text-center text-xs text-muted-foreground">Sin turnos</p>
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

        {/* TAB 2: PACIENTES Y ESTUDIOS (Clínica + Recepción de Derivaciones / Alta Express) */}
        <TabsContent value="patients" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={patientsSubView === 'linked' ? 'default' : 'outline'}
              onClick={() => setPatientsSubView('linked')}
            >
              <PawPrint className="mr-2 h-4 w-4" />
              Mis Pacientes ({data.pets.length})
            </Button>
            <Button
              type="button"
              variant={patientsSubView === 'diagnostic' ? 'default' : 'outline'}
              onClick={() => setPatientsSubView('diagnostic')}
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Recepción de Estudios y Derivaciones
            </Button>
          </div>

          {patientsSubView === 'linked' ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Ficha clínica del paciente</CardTitle>
                    <CardDescription>
                      Seleccioná un paciente vinculado para consultar sus evoluciones y subir estudios.
                    </CardDescription>
                  </div>

                  {data.pets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Seleccionar paciente vinculado"
                        value={selectedLinkedPetId}
                        onChange={(event) => {
                          setSelectedLinkedPetId(event.target.value)
                          setShowNewConsultationForm(false)
                        }}
                        className="h-10 min-w-[240px] rounded-md border bg-background px-3 text-sm"
                      >
                        {data.pets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {petLabel(pet, linkedClientName.get(pet.usuario_id) || 'Cliente')}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        onClick={() => setShowNewConsultationForm((prev) => !prev)}
                      >
                        <ClipboardPlus className="mr-2 h-4 w-4" />
                        {showNewConsultationForm ? 'Cerrar evolución' : 'Nueva consulta'}
                      </Button>
                    </div>
                  )}
                </CardHeader>

                {data.pets.length === 0 ? (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Todavía no tenés pacientes vinculados por turnos. Si recibiste una derivación externa para análisis, usá{' '}
                      <button
                        type="button"
                        className="font-medium text-primary underline"
                        onClick={() => setPatientsSubView('diagnostic')}
                      >
                        Recepción de Estudios y Derivaciones
                      </button>
                      .
                    </p>
                  </CardContent>
                ) : (
                  selectedLinkedPet && (
                    <CardContent className="space-y-6">
                      {showNewConsultationForm && (
                        <form
                          onSubmit={async (event) => {
                            await createMedicalRecord(event)
                            setShowNewConsultationForm(false)
                          }}
                          className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2"
                        >
                          <input type="hidden" name="medical-pet" value={selectedLinkedPet.id} />
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="medical-reason">Motivo de consulta</Label>
                            <Input id="medical-reason" name="medical-reason" minLength={3} maxLength={255} required />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="medical-diagnosis">Diagnóstico</Label>
                            <Textarea id="medical-diagnosis" name="medical-diagnosis" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="medical-treatment">Tratamiento</Label>
                            <Textarea id="medical-treatment" name="medical-treatment" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="medical-weight">Peso (kg)</Label>
                            <Input id="medical-weight" name="medical-weight" type="number" min="0" step="0.01" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="medical-temperature">Temperatura (°C)</Label>
                            <Input id="medical-temperature" name="medical-temperature" type="number" min="30" max="45" step="0.1" />
                          </div>
                          <div className="flex justify-end gap-2 md:col-span-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setShowNewConsultationForm(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              Guardar consulta
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* Estudios clínicos del paciente vinculado */}
                      <ClinicalStudiesSection
                        petId={selectedLinkedPet.id}
                        canUpload={true}
                      />

                      {/* Evoluciones médicas del paciente */}
                      <div className="space-y-3 border-t pt-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">
                          Evoluciones registradas ({selectedLinkedPetRecords.length})
                        </h3>
                        {selectedLinkedPetRecords.map((record) => (
                          <article key={record.id} className="rounded-lg border p-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h4 className="font-semibold">{record.motivo_consulta}</h4>
                              <time className="text-xs text-muted-foreground">
                                {displayDate(record.fecha_consulta)}
                              </time>
                            </div>
                            {record.diagnostico && (
                              <p className="mt-2 text-sm">
                                <strong>Diagnóstico:</strong> {record.diagnostico}
                              </p>
                            )}
                            {record.tratamiento && (
                              <p className="mt-1 text-sm">
                                <strong>Tratamiento:</strong> {record.tratamiento}
                              </p>
                            )}
                            {(record.peso_kg != null || record.temperatura_c != null) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {record.peso_kg != null ? `Peso: ${record.peso_kg} kg` : ''}
                                {record.peso_kg != null && record.temperatura_c != null ? ' · ' : ''}
                                {record.temperatura_c != null ? `Temperatura: ${record.temperatura_c} °C` : ''}
                              </p>
                            )}
                          </article>
                        ))}
                        {selectedLinkedPetRecords.length === 0 && (
                          <p className="py-3 text-sm text-muted-foreground">
                            Sin evoluciones registradas para {selectedLinkedPet.nombre}.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )
                )}
              </Card>
            </div>
          ) : (
            /* SUBVISTA: RECEPCIÓN DE ESTUDIOS / DERIVACIONES + ALTA EXPRESS */
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Centro de Diagnóstico y Derivaciones</CardTitle>
                  <CardDescription>
                    Buscá una mascota que ya tenga PetQR o hacé un Alta Express con credencial QR clínica (sin rastreo en mapa).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 border-b pb-4">
                    <Button
                      type="button"
                      size="sm"
                      variant={diagnosticMode === 'lookup' ? 'secondary' : 'ghost'}
                      onClick={() => {
                        setDiagnosticMode('lookup')
                        clearAltaExpressResult()
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      1. Ya usa PetQR (Buscar por QR o dueño)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={diagnosticMode === 'express' ? 'secondary' : 'ghost'}
                      onClick={() => {
                        setDiagnosticMode('express')
                        setSelectedExternalPet(null)
                      }}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      2. No usa PetQR (Alta Express + QR Clínico)
                    </Button>
                  </div>

                  {diagnosticMode === 'lookup' ? (
                    <div className="space-y-4">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          void searchPetForStudy(diagnosticQuery)
                        }}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <Input
                          placeholder="Ingresá código QR (ej. PET-123 o CLN-123), email o teléfono del dueño"
                          value={diagnosticQuery}
                          onChange={(event) => setDiagnosticQuery(event.target.value)}
                        />
                        <Button type="submit" disabled={isSearchingDiagnosticPet}>
                          <Search className="mr-2 h-4 w-4" />
                          {isSearchingDiagnosticPet ? 'Buscando...' : 'Buscar'}
                        </Button>
                      </form>

                      {diagnosticLookupResults.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {diagnosticLookupResults.map((item) => {
                            const isSelected = selectedExternalPet?.pet_id === item.pet_id
                            return (
                              <button
                                key={item.pet_id}
                                type="button"
                                onClick={() => setSelectedExternalPet(item)}
                                className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="font-semibold">
                                    {item.pet_name} <span className="font-normal capitalize text-muted-foreground">({item.especie})</span>
                                  </span>
                                  {item.qr_codigo && (
                                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                                      {item.qr_codigo}
                                    </span>
                                  )}
                                </div>
                                <span className="mt-1 text-xs text-muted-foreground">
                                  Tutor: {item.owner_name} · {item.owner_email}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* FORMULARIO DE ALTA EXPRESS */
                    <form
                      onSubmit={async (event) => {
                        await registerAltaExpress(event)
                      }}
                      className="grid gap-4 md:grid-cols-3"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="express-owner-name">Nombre del dueño</Label>
                        <Input id="express-owner-name" name="express-owner-name" required maxLength={100} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="express-owner-email">Correo del dueño</Label>
                        <Input id="express-owner-email" name="express-owner-email" type="email" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="express-owner-phone">WhatsApp del dueño</Label>
                        <Input
                          id="express-owner-phone"
                          name="express-owner-phone"
                          type="tel"
                          required
                          placeholder="+5492494112233"
                          pattern="^\+[1-9]\d{9,14}$"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="express-pet-name">Nombre de la mascota</Label>
                        <Input id="express-pet-name" name="express-pet-name" required maxLength={100} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="express-pet-species">Especie</Label>
                        <Input id="express-pet-species" name="express-pet-species" required placeholder="perro / gato" maxLength={50} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="express-pet-breed">Raza (opcional)</Label>
                        <Input id="express-pet-breed" name="express-pet-breed" maxLength={100} />
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="md:col-span-3">
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Generar ficha y QR Clínico para subir estudio
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Tarjeta de credencial generada (Alta Express) */}
              {altaExpressResult && (
                <Card className="border-primary/40 bg-primary/5">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
                          {altaExpressResult.qr_codigo}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          Credencial QR Clínica (sin rastreo GPS en mapa)
                        </span>
                      </div>
                      <p className="text-sm font-medium">{altaExpressResult.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Paciente: {altaExpressResult.pet_nombre} · Tutor: {altaExpressResult.owner_nombre} ({altaExpressResult.owner_email})
                      </p>
                    </div>

                    {altaExpressResult.activation_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (altaExpressResult.activation_url) {
                            void navigator.clipboard.writeText(altaExpressResult.activation_url)
                            setCopiedActivationUrl(true)
                            setTimeout(() => setCopiedActivationUrl(false), 2500)
                          }
                        }}
                      >
                        {copiedActivationUrl ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Enlace copiado
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar acceso para WhatsApp
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Subida directa de estudio para la mascota seleccionada o recién creada */}
              {activeDiagnosticPet && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Cargar estudio para {activeDiagnosticPet.nombre}
                    </CardTitle>
                    <CardDescription>
                      Tutor: {activeDiagnosticPet.ownerName}
                      {activeDiagnosticPet.qrCodigo ? ` · QR: ${activeDiagnosticPet.qrCodigo}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClinicalStudiesSection
                      petId={activeDiagnosticPet.id}
                      canUpload={true}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: MEDALLAS Y RASTREO (Unifica QRs físicos + Mapa de escaneos) */}
        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa de escaneos de medallas físicas
              </CardTitle>
              <CardDescription>
                Ubicaciones de escaneos de medallas PetQR de tus pacientes (excluye credenciales clínicas).
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
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Medallas QR vinculadas ({physicalQrs.length})</CardTitle>
                <CardDescription>
                  Inventario de placas físicas asociadas a tus pacientes.
                </CardDescription>
              </div>
              <div className="w-full sm:max-w-xs">
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
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
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
                      <td className="p-3 font-medium">{qr.mascota_nombre}</td>
                      <td className="p-3">{qr.dueno_nombre}</td>
                      <td className="p-3">{qr.activo ? 'Activa' : 'Inactiva'}</td>
                    </tr>
                  ))}
                  {filteredQrs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        No hay medallas físicas que coincidan con la búsqueda.
                      </td>
                    </tr>
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
      </Tabs>
    </div>
  )
}