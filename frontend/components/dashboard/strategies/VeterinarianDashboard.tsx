'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  Thermometer,
  Trash2,
  Users,
  Weight,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types/auth'
import type {
  AppointmentStatus,
  DiagnosticPetLookupItem,
  VeterinarianPet,
} from '@/lib/types/veterinarian'

interface VeterinarianDashboardProps {
  user: User
}

/* ----------------------------------------------------------------------------
 * Utilidades de fecha
 * ------------------------------------------------------------------------- */

function petLabel(pet: VeterinarianPet, clientName: string) {
  return `${pet.nombre} (${clientName})`
}

function displayDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
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

function formatTime(value: string) {
  return parseAppointmentDate(value).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ----------------------------------------------------------------------------
 * Piezas visuales reutilizables
 * ------------------------------------------------------------------------- */

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50'

const statusMeta: Record<AppointmentStatus, { label: string; className: string }> = {
  PROGRAMADO: {
    label: 'Programado',
    className: 'border-transparent bg-secondary text-secondary-foreground',
  },
  ATENDIDO: {
    label: 'Atendido',
    className: 'border-transparent bg-accent text-accent-foreground',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'border-border bg-transparent text-muted-foreground line-through',
  },
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = statusMeta[status] ?? statusMeta.PROGRAMADO
  return (
    <Badge variant="outline" className={cn('rounded-full px-2 py-0 text-[11px] font-medium', meta.className)}>
      {meta.label}
    </Badge>
  )
}

function KpiStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-20 flex-col gap-0.5 px-4 first:pl-0 last:pr-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</dd>
    </div>
  )
}

function SectionHeading({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          {icon}
          {title}
        </h2>
        {description && <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

function FormField({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function EmptyState({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon: ReactNode }[]
  ariaLabel: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex w-full flex-wrap gap-1 rounded-lg bg-muted p-1 sm:w-auto">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Componente principal
 * ------------------------------------------------------------------------- */

export default function VeterinarianDashboard({ user }: VeterinarianDashboardProps) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [mobileAgendaDayIndex, setMobileAgendaDayIndex] = useState(
    () => (new Date().getDay() + 6) % 7,
  )

  // Paneles colapsables bajo demanda
  const [showClinicSettings, setShowClinicSettings] = useState(false)
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false)
  const [patientsSubView, setPatientsSubView] = useState<'linked' | 'diagnostic'>('linked')
  const [selectedLinkedPetId, setSelectedLinkedPetId] = useState<string>('')
  const [patientFilter, setPatientFilter] = useState('')
  const [showNewConsultationForm, setShowNewConsultationForm] = useState(false)

  // Recepción de estudios / derivaciones
  const [diagnosticMode, setDiagnosticMode] = useState<'lookup' | 'express'>('lookup')
  const [diagnosticQuery, setDiagnosticQuery] = useState('')
  const [selectedExternalPet, setSelectedExternalPet] = useState<DiagnosticPetLookupItem | null>(null)
  const [copiedActivationUrl, setCopiedActivationUrl] = useState(false)
  const [copiedClientUrl, setCopiedClientUrl] = useState(false)

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
    () =>
      Array.from({ length: 7 }, (_, index) => {
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

  // Solo medallas físicas en Medallas y Rastreo
  const physicalQrs = useMemo(
    () => (data?.qrs ?? []).filter((qr) => (qr as { tipo?: string }).tipo !== 'CLINICO'),
    [data?.qrs],
  )

  const filteredQrs = useMemo(() => {
    const term = qrSearch.trim().toLocaleLowerCase()
    if (!term) return physicalQrs
    return physicalQrs.filter((qr) =>
      [qr.codigo, qr.mascota_nombre, qr.dueno_nombre].some((value) =>
        value.toLocaleLowerCase().includes(term),
      ),
    )
  }, [physicalQrs, qrSearch])

  const filteredLinkedPets = useMemo(() => {
    const term = patientFilter.trim().toLocaleLowerCase()
    const pets = data?.pets ?? []
    if (!term) return pets
    return pets.filter((pet) =>
      [pet.nombre, pet.especie, linkedClientName.get(pet.usuario_id) ?? ''].some((value) =>
        value.toLocaleLowerCase().includes(term),
      ),
    )
  }, [data?.pets, patientFilter, linkedClientName])

  const visibleQrs = filteredQrs.slice((qrPage - 1) * qrPageSize, qrPage * qrPageSize)

  if (isLoading) {
    return (
      <div className="theme-clinical flex flex-col gap-6 rounded-2xl bg-background p-1 text-foreground" aria-busy="true">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-80 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <span className="sr-only">Cargando panel veterinario...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="theme-clinical rounded-2xl bg-background text-foreground">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>No se pudo cargar el panel veterinario</CardTitle>
            <CardDescription>{error || 'El servidor no devolvió los datos del panel.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
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

  // Mascota activa en Recepción de Estudios (encontrada o recién creada en Alta Express)
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

  const shiftWeek = (days: number) =>
    setWeekStart((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + days)
      return next
    })

  const goToToday = () => {
    setWeekStart(mondayOf(new Date()))
    setMobileAgendaDayIndex((new Date().getDay() + 6) % 7)
  }

  return (
    <div className="theme-clinical flex flex-col gap-8 rounded-2xl bg-background text-foreground">
      {/* ================================================================
       * HEADER: identidad de la clínica + KPIs + acceso a administración
       * ============================================================== */}
      <header className="flex flex-col gap-6 rounded-xl border bg-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {data.clinic?.logo_url ? (
            <img
              key={data.clinic.logo_url}
              src={getApiAssetUrl(data.clinic.logo_url) || '/placeholder.svg'}
              alt={`Logo de ${data.clinic.nombre_clinica}`}
              className="size-14 shrink-0 rounded-xl border bg-background object-contain p-1.5"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Centro veterinario
            </p>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              {data.clinic?.nombre_clinica || 'Panel veterinario'}
            </h1>
            <p className="text-sm text-muted-foreground">Hola, {user.nombre}.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <dl className="flex items-center divide-x">
            <KpiStat label="Turnos hoy" value={todayAppointmentsCount} />
            <KpiStat label="Pacientes" value={data.pets.length} />
            <KpiStat label="Medallas" value={physicalQrs.length} />
          </dl>

          <Button
            type="button"
            variant={showClinicSettings ? 'secondary' : 'outline'}
            aria-expanded={showClinicSettings}
            aria-controls="clinic-admin-panel"
            onClick={() => setShowClinicSettings((prev) => !prev)}
          >
            {showClinicSettings ? (
              <X className="mr-2 h-4 w-4" />
            ) : (
              <Building2 className="mr-2 h-4 w-4" />
            )}
            {showClinicSettings ? 'Cerrar administración' : 'Mi Clínica y Clientes'}
          </Button>
        </div>
      </header>

      {/* ================================================================
       * PANEL COLAPSABLE: Logo, clientes habituales y Conocimiento IA
       * ============================================================== */}
      {showClinicSettings && (
        <section
          id="clinic-admin-panel"
          aria-label="Administración de la clínica y clientes"
          className="flex flex-col gap-6 rounded-xl border bg-muted/50 p-5 sm:p-6"
        >
          <SectionHeading
            icon={<Building2 className="h-5 w-5 text-primary" aria-hidden="true" />}
            title="Mi Clínica y Clientes"
            description="Identidad institucional, alta de clientes habituales y base de conocimiento del asistente."
          />

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Identidad institucional</CardTitle>
                <CardDescription>Tus clientes vinculados verán este logo en su aplicación.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {data.clinic?.logo_url ? (
                  <img
                    key={data.clinic.logo_url}
                    src={getApiAssetUrl(data.clinic.logo_url) || '/placeholder.svg'}
                    alt={`Logo actual de ${data.clinic.nombre_clinica}`}
                    className="size-20 shrink-0 rounded-xl border bg-background object-contain p-2"
                  />
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                    Sin logo
                  </div>
                )}
                <FormField id="clinic-logo" label="PNG, JPG o WebP · máx. 2 MB" className="flex-1">
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
                </FormField>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Registrar cliente habitual</CardTitle>
                <CardDescription>
                  Le enviamos por WhatsApp un enlace para activar su cuenta con contraseña privada.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <form onSubmit={createClient} className="grid gap-4 sm:grid-cols-2">
                  <FormField id="client-name" label="Nombre y apellido">
                    <Input id="client-name" name="client-name" required maxLength={100} autoComplete="name" />
                  </FormField>
                  <FormField id="client-email" label="Correo electrónico">
                    <Input id="client-email" name="client-email" type="email" required autoComplete="email" />
                  </FormField>
                  <FormField
                    id="client-phone"
                    label="WhatsApp"
                    hint="Formato internacional, ej. +5492494112233"
                    className="sm:col-span-2"
                  >
                    <Input
                      id="client-phone"
                      name="client-phone"
                      type="tel"
                      required
                      placeholder="+5492494112233"
                      pattern="^\+[1-9]\d{9,14}$"
                      autoComplete="tel"
                    />
                  </FormField>
                  <div className="flex justify-end sm:col-span-2">
                    <Button type="submit" disabled={isSubmitting}>
                      <Users className="mr-2 h-4 w-4" />
                      Crear cliente y enviar activación
                    </Button>
                  </div>
                </form>

                {createdClient?.activation_url && (
                  <div
                    role="status"
                    className="flex flex-col gap-3 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground"
                  >
                    <p className="leading-relaxed">{createdClient.message}</p>
                    <a
                      className="break-all font-mono text-xs underline underline-offset-4"
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
                      className="self-start bg-card"
                      onClick={() => {
                        if (createdClient.activation_url) {
                          void navigator.clipboard.writeText(createdClient.activation_url)
                          setCopiedClientUrl(true)
                          setTimeout(() => setCopiedClientUrl(false), 2500)
                        }
                      }}
                    >
                      {copiedClientUrl ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
                      {copiedClientUrl ? 'Enlace copiado' : 'Copiar enlace de activación'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Clientes vinculados</CardTitle>
                <CardDescription>{data.clients.length} registrados</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-y bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="px-6 py-3 font-medium">Nombre</th>
                    <th scope="col" className="px-4 py-3 font-medium">Correo</th>
                    <th scope="col" className="px-4 py-3 font-medium">Teléfono</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Mascotas</th>
                    <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                    <th scope="col" className="px-6 py-3 text-right font-medium">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.clients.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-6 py-3 font-medium text-foreground">{client.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{client.telefono || '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{client.mascotas_count}</td>
                      <td className="px-4 py-3">
                        {client.pending_activation ? (
                          <Badge variant="outline" className="rounded-full font-medium text-muted-foreground">
                            Pendiente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full border-transparent bg-accent font-medium text-accent-foreground">
                            Activa
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {client.pending_activation && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isSubmitting}
                            onClick={() => void resendClientActivation(client.id)}
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Reenviar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.clients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
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

      {/* ================================================================
       * NAVEGACIÓN PRINCIPAL: 3 espacios
       * ============================================================== */}
      <Tabs defaultValue="appointments" className="flex flex-col gap-6">
        <TabsList className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b bg-transparent p-0 text-muted-foreground">
          {[
            { value: 'appointments', label: 'Agenda', icon: CalendarDays },
            { value: 'patients', label: 'Pacientes y Estudios', icon: Stethoscope },
            { value: 'tracking', label: 'Medallas y Rastreo', icon: QrCode },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="-mb-px gap-2 rounded-none border-b-2 border-transparent px-1 pb-3 pt-1 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ==============================================================
         * TAB 1: AGENDA
         * ============================================================ */}
        <TabsContent value="appointments" className="mt-0 flex flex-col gap-5">
          <SectionHeading
            title="Agenda semanal"
            description={
              <span className="capitalize">
                {weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                {' – '}
                {weekEnd.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            }
            actions={
              <>
                <div className="flex items-center rounded-md border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-r-none"
                    aria-label="Semana anterior"
                    onClick={() => shiftWeek(-7)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="rounded-none border-x px-3" onClick={goToToday}>
                    Hoy
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-l-none"
                    aria-label="Semana siguiente"
                    onClick={() => shiftWeek(7)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant={showNewAppointmentForm ? 'secondary' : 'default'}
                  aria-expanded={showNewAppointmentForm}
                  aria-controls="new-appointment-form"
                  onClick={() => setShowNewAppointmentForm((prev) => !prev)}
                >
                  {showNewAppointmentForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {showNewAppointmentForm ? 'Cerrar' : 'Nuevo turno'}
                </Button>
              </>
            }
          />

          {showNewAppointmentForm && (
            <Card id="new-appointment-form">
              <CardHeader>
                <CardTitle className="text-base">Nuevo turno</CardTitle>
                <CardDescription>Se notificará al tutor con un recordatorio automático.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.available_pets.length === 0 ? (
                  <EmptyState icon={<PawPrint className="h-5 w-5" />}>
                    No hay clientes con mascotas registradas para agendar un turno.
                  </EmptyState>
                ) : (
                  <form
                    onSubmit={async (event) => {
                      await createAppointment(event)
                      setShowNewAppointmentForm(false)
                    }}
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                  >
                    <FormField id="appointment-pet" label="Paciente y tutor" className="md:col-span-2">
                      <select id="appointment-pet" name="appointment-pet" required className={selectClassName}>
                        {data.available_pets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {petLabel(pet, availableClientName.get(pet.usuario_id) || 'Cliente')}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="appointment-start" label="Inicio">
                      <Input id="appointment-start" name="appointment-start" type="datetime-local" required />
                    </FormField>
                    <FormField id="appointment-end" label="Fin">
                      <Input id="appointment-end" name="appointment-end" type="datetime-local" required />
                    </FormField>
                    <FormField id="appointment-service" label="Servicio" className="md:col-span-1 lg:col-span-2">
                      <Input
                        id="appointment-service"
                        name="appointment-service"
                        maxLength={50}
                        required
                        placeholder="Consulta general, ecografía, vacunación…"
                      />
                    </FormField>
                    <FormField id="appointment-notes" label="Observaciones (opcional)" className="md:col-span-1 lg:col-span-2">
                      <Input id="appointment-notes" name="appointment-notes" />
                    </FormField>
                    <div className="flex justify-end gap-2 md:col-span-2 lg:col-span-4">
                      <Button type="button" variant="ghost" onClick={() => setShowNewAppointmentForm(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar turno
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selector de día (solo mobile) */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 sm:hidden" role="tablist" aria-label="Día de la semana">
            {weekDays.map((day, index) => {
              const active = index === mobileAgendaDayIndex
              const isToday = dateOnly(day) === todayKey
              return (
                <button
                  key={dateOnly(day)}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMobileAgendaDayIndex(index)}
                  className={cn(
                    'flex min-w-12 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground',
                  )}
                >
                  <span className="capitalize">{day.toLocaleDateString('es-AR', { weekday: 'short' })}</span>
                  <span className={cn('text-base font-semibold tabular-nums', !active && isToday && 'text-primary')}>
                    {day.getDate()}
                  </span>
                </button>
              )
            })}
          </div>

          {appointmentsError ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {appointmentsError}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <div className="grid grid-cols-1 sm:min-w-[980px] sm:grid-cols-7 sm:divide-x">
                {weekDays.map((day, index) => {
                  const dayKey = dateOnly(day)
                  const isToday = dayKey === todayKey
                  const dayAppointments = weeklyAppointments
                    .filter((appointment) => dateOnly(parseAppointmentDate(appointment.fecha_hora_inicio)) === dayKey)
                    .sort(
                      (a, b) =>
                        parseAppointmentDate(a.fecha_hora_inicio).getTime() -
                        parseAppointmentDate(b.fecha_hora_inicio).getTime(),
                    )
                  const isMobileAgendaDay = index === mobileAgendaDayIndex
                  return (
                    <section
                      key={dayKey}
                      aria-label={day.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      className={cn('min-h-72 flex-col', isMobileAgendaDay ? 'flex' : 'hidden sm:flex', isToday && 'bg-secondary/40')}
                    >
                      <header className="flex items-baseline justify-between gap-2 border-b px-3 py-3">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                        </span>
                        <span
                          className={cn(
                            'flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                          )}
                        >
                          {day.getDate()}
                        </span>
                      </header>
                      <div className="flex flex-1 flex-col gap-2 p-2">
                        {dayAppointments.map((appointment) => {
                          const pet = data.available_pets.find((item) => item.id === appointment.mascota_id)
                          const clientName = availableClientName.get(appointment.dueno_id || '') || 'Cliente'
                          const isCancelled = appointment.estado === 'CANCELADO'
                          return (
                            <article
                              key={appointment.id}
                              className={cn(
                                'flex flex-col gap-2 rounded-lg border bg-card p-3 text-xs shadow-xs',
                                isCancelled && 'opacity-60',
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <time
                                  dateTime={appointment.fecha_hora_inicio}
                                  className="font-mono text-[11px] font-medium tabular-nums text-muted-foreground"
                                >
                                  {formatTime(appointment.fecha_hora_inicio)}
                                  {appointment.fecha_hora_fin ? `–${formatTime(appointment.fecha_hora_fin)}` : ''}
                                </time>
                                <StatusBadge status={appointment.estado} />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold leading-tight text-foreground">
                                  {pet?.nombre || 'Mascota'}
                                </p>
                                <p className="text-muted-foreground">{clientName}</p>
                              </div>
                              <p className="leading-relaxed text-foreground">{appointment.tipo_servicio}</p>
                              {appointment.observaciones && (
                                <p className="line-clamp-2 leading-relaxed text-muted-foreground">
                                  {appointment.observaciones}
                                </p>
                              )}
                              {appointment.estado === 'PROGRAMADO' && (
                                <div className="flex gap-1 border-t pt-2">
                                  <Button
                                    size="sm"
                                    className="h-7 flex-1 px-2 text-[11px]"
                                    disabled={isSubmitting}
                                    onClick={() => void updateAppointmentStatus(appointment.id, 'ATENDIDO')}
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    Atendido
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-7 text-muted-foreground hover:text-destructive"
                                    disabled={isSubmitting}
                                    aria-label={`Eliminar turno de ${pet?.nombre || 'mascota'}`}
                                    onClick={() => {
                                      if (window.confirm('¿Eliminar este turno de la agenda? Se conservará como cancelado en el historial.')) {
                                        void deleteAppointment(appointment.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </article>
                          )
                        })}
                        {dayAppointments.length === 0 && (
                          <p className="m-auto py-6 text-center text-xs text-muted-foreground/70">Sin turnos</p>
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==============================================================
         * TAB 2: PACIENTES Y ESTUDIOS
         * ============================================================ */}
        <TabsContent value="patients" className="mt-0 flex flex-col gap-5">
          <SegmentedControl
            ariaLabel="Vista de pacientes"
            value={patientsSubView}
            onChange={setPatientsSubView}
            options={[
              {
                value: 'linked',
                label: `Mis Pacientes (${data.pets.length})`,
                icon: <PawPrint className="h-4 w-4" aria-hidden="true" />,
              },
              {
                value: 'diagnostic',
                label: 'Recepción de Estudios y Derivaciones',
                icon: <FlaskConical className="h-4 w-4" aria-hidden="true" />,
              },
            ]}
          />

          {patientsSubView === 'linked' ? (
            data.pets.length === 0 ? (
              <EmptyState icon={<PawPrint className="h-5 w-5" />}>
                Todavía no tenés pacientes vinculados por turnos. Si recibiste una derivación externa para análisis, usá{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-4"
                  onClick={() => setPatientsSubView('diagnostic')}
                >
                  Recepción de Estudios y Derivaciones
                </button>
                .
              </EmptyState>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                {/* Listado de pacientes */}
                <aside className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:sticky lg:top-4 lg:self-start">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      aria-label="Filtrar pacientes"
                      placeholder="Buscar paciente o tutor"
                      value={patientFilter}
                      onChange={(event) => setPatientFilter(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto lg:max-h-[560px]" aria-label="Pacientes vinculados">
                    {filteredLinkedPets.map((pet) => {
                      const active = pet.id === selectedLinkedPetId
                      return (
                        <li key={pet.id}>
                          <button
                            type="button"
                            aria-current={active ? 'true' : undefined}
                            onClick={() => {
                              setSelectedLinkedPetId(pet.id)
                              setShowNewConsultationForm(false)
                            }}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              active ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase',
                                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                              )}
                              aria-hidden="true"
                            >
                              {pet.nombre.slice(0, 2)}
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium">{pet.nombre}</span>
                              <span className={cn('truncate text-xs', active ? 'text-secondary-foreground/80' : 'text-muted-foreground')}>
                                <span className="capitalize">{pet.especie}</span>
                                {' · '}
                                {linkedClientName.get(pet.usuario_id) || 'Cliente'}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                    {filteredLinkedPets.length === 0 && (
                      <li className="px-3 py-6 text-center text-xs text-muted-foreground">Sin coincidencias.</li>
                    )}
                  </ul>
                </aside>

                {/* Ficha clínica */}
                {selectedLinkedPet && (
                  <div className="flex min-w-0 flex-col gap-5">
                    <Card>
                      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ficha clínica</p>
                          <CardTitle className="text-2xl font-semibold tracking-tight">{selectedLinkedPet.nombre}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="rounded-full font-medium capitalize">
                              {selectedLinkedPet.especie}
                            </Badge>
                            <span>Tutor: {linkedClientName.get(selectedLinkedPet.usuario_id) || 'Cliente'}</span>
                            {selectedLinkedPet.qr?.codigo && (
                              <span className="font-mono text-xs">· {selectedLinkedPet.qr.codigo}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant={showNewConsultationForm ? 'secondary' : 'default'}
                          aria-expanded={showNewConsultationForm}
                          aria-controls="new-consultation-form"
                          onClick={() => setShowNewConsultationForm((prev) => !prev)}
                        >
                          {showNewConsultationForm ? <X className="mr-2 h-4 w-4" /> : <ClipboardPlus className="mr-2 h-4 w-4" />}
                          {showNewConsultationForm ? 'Cerrar' : 'Nueva consulta'}
                        </Button>
                      </CardHeader>

                      {showNewConsultationForm && (
                        <CardContent>
                          <form
                            id="new-consultation-form"
                            onSubmit={async (event) => {
                              await createMedicalRecord(event)
                              setShowNewConsultationForm(false)
                            }}
                            className="grid gap-4 rounded-lg border bg-muted/40 p-4 md:grid-cols-2"
                          >
                            <input type="hidden" name="medical-pet" value={selectedLinkedPet.id} />
                            <FormField id="medical-reason" label="Motivo de consulta" className="md:col-span-2">
                              <Input id="medical-reason" name="medical-reason" minLength={3} maxLength={255} required />
                            </FormField>
                            <FormField id="medical-diagnosis" label="Diagnóstico">
                              <Textarea id="medical-diagnosis" name="medical-diagnosis" rows={4} />
                            </FormField>
                            <FormField id="medical-treatment" label="Tratamiento">
                              <Textarea id="medical-treatment" name="medical-treatment" rows={4} />
                            </FormField>
                            <FormField id="medical-weight" label="Peso (kg)">
                              <Input id="medical-weight" name="medical-weight" type="number" min="0" step="0.01" inputMode="decimal" />
                            </FormField>
                            <FormField id="medical-temperature" label="Temperatura (°C)">
                              <Input id="medical-temperature" name="medical-temperature" type="number" min="30" max="45" step="0.1" inputMode="decimal" />
                            </FormField>
                            <div className="flex justify-end gap-2 md:col-span-2">
                              <Button type="button" variant="ghost" onClick={() => setShowNewConsultationForm(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                Guardar consulta
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      )}
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
                          Estudios clínicos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ClinicalStudiesSection petId={selectedLinkedPet.id} canUpload={true} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Stethoscope className="h-4 w-4 text-primary" aria-hidden="true" />
                          Historial de consultas
                        </CardTitle>
                        <CardDescription>{selectedLinkedPetRecords.length} evoluciones registradas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedLinkedPetRecords.length === 0 ? (
                          <EmptyState icon={<ClipboardPlus className="h-5 w-5" />}>
                            Sin evoluciones registradas para {selectedLinkedPet.nombre}.
                          </EmptyState>
                        ) : (
                          <ol className="flex flex-col">
                            {selectedLinkedPetRecords.map((record, index) => (
                              <li key={record.id} className="relative flex gap-4 pb-6 last:pb-0">
                                {index < selectedLinkedPetRecords.length - 1 && (
                                  <span className="absolute left-[5px] top-4 h-full w-px bg-border" aria-hidden="true" />
                                )}
                                <span className="relative mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-secondary" aria-hidden="true" />
                                <article className="flex min-w-0 flex-1 flex-col gap-2">
                                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                                    <h4 className="font-semibold text-foreground">{record.motivo_consulta}</h4>
                                    <time dateTime={record.fecha_consulta} className="shrink-0 text-xs text-muted-foreground">
                                      {displayDate(record.fecha_consulta)}
                                    </time>
                                  </div>
                                  {(record.diagnostico || record.tratamiento) && (
                                    <dl className="grid gap-2 text-sm leading-relaxed sm:grid-cols-2">
                                      {record.diagnostico && (
                                        <div className="flex flex-col gap-0.5">
                                          <dt className="text-xs font-medium text-muted-foreground">Diagnóstico</dt>
                                          <dd>{record.diagnostico}</dd>
                                        </div>
                                      )}
                                      {record.tratamiento && (
                                        <div className="flex flex-col gap-0.5">
                                          <dt className="text-xs font-medium text-muted-foreground">Tratamiento</dt>
                                          <dd>{record.tratamiento}</dd>
                                        </div>
                                      )}
                                    </dl>
                                  )}
                                  {(record.peso_kg != null || record.temperatura_c != null) && (
                                    <div className="flex flex-wrap gap-2">
                                      {record.peso_kg != null && (
                                        <Badge variant="outline" className="gap-1 rounded-full font-normal tabular-nums">
                                          <Weight className="h-3 w-3" aria-hidden="true" />
                                          {record.peso_kg} kg
                                        </Badge>
                                      )}
                                      {record.temperatura_c != null && (
                                        <Badge variant="outline" className="gap-1 rounded-full font-normal tabular-nums">
                                          <Thermometer className="h-3 w-3" aria-hidden="true" />
                                          {record.temperatura_c} °C
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </article>
                              </li>
                            ))}
                          </ol>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )
          ) : (
            /* SUBVISTA: RECEPCIÓN DE ESTUDIOS / DERIVACIONES + ALTA EXPRESS */
            <div className="flex flex-col gap-5">
              <Card>
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle>Recepción de estudios y derivaciones</CardTitle>
                  <CardDescription className="text-pretty leading-relaxed">
                    Buscá una mascota que ya tenga PetQR o registrala con un Alta Express y una credencial QR clínica (sin rastreo en mapa).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de recepción">
                    {[
                      {
                        mode: 'lookup' as const,
                        icon: Search,
                        title: 'Ya usa PetQR',
                        text: 'Buscar por código QR, email o teléfono del tutor.',
                      },
                      {
                        mode: 'express' as const,
                        icon: FilePlus2,
                        title: 'No usa PetQR',
                        text: 'Alta Express con credencial QR clínica CLN.',
                      },
                    ].map(({ mode, icon: Icon, title, text }) => {
                      const active = diagnosticMode === mode
                      return (
                        <button
                          key={mode}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            setDiagnosticMode(mode)
                            if (mode === 'lookup') clearAltaExpressResult()
                            else setSelectedExternalPet(null)
                          }}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active ? 'border-primary bg-secondary' : 'hover:bg-muted/60',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-md',
                              active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-foreground">{title}</span>
                            <span className="text-xs leading-relaxed text-muted-foreground">{text}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {diagnosticMode === 'lookup' ? (
                    <div className="flex flex-col gap-4">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          void searchPetForStudy(diagnosticQuery)
                        }}
                        className="flex flex-col gap-2 sm:flex-row"
                        role="search"
                      >
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                          <Input
                            aria-label="Buscar mascota por QR o tutor"
                            placeholder="PET-123, CLN-123, email o teléfono del tutor"
                            value={diagnosticQuery}
                            onChange={(event) => setDiagnosticQuery(event.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Button type="submit" disabled={isSearchingDiagnosticPet}>
                          {isSearchingDiagnosticPet ? 'Buscando…' : 'Buscar'}
                        </Button>
                      </form>

                      {diagnosticLookupResults.length > 0 && (
                        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Resultados de búsqueda">
                          {diagnosticLookupResults.map((item) => {
                            const isSelected = selectedExternalPet?.pet_id === item.pet_id
                            return (
                              <li key={item.pet_id}>
                                <button
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => setSelectedExternalPet(item)}
                                  className={cn(
                                    'flex w-full flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    isSelected ? 'border-primary bg-secondary' : 'hover:bg-muted/60',
                                  )}
                                >
                                  <span className="flex w-full items-center justify-between gap-2">
                                    <span className="font-semibold text-foreground">
                                      {item.pet_name}{' '}
                                      <span className="font-normal capitalize text-muted-foreground">· {item.especie}</span>
                                    </span>
                                    {item.qr_codigo && (
                                      <Badge variant="outline" className="rounded-md bg-card font-mono text-[11px] font-medium">
                                        {item.qr_codigo}
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Tutor: {item.owner_name} · {item.owner_email}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={async (event) => {
                        await registerAltaExpress(event)
                      }}
                      className="flex flex-col gap-5"
                    >
                      <fieldset className="grid gap-4 md:grid-cols-3">
                        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Tutor
                        </legend>
                        <FormField id="express-owner-name" label="Nombre y apellido">
                          <Input id="express-owner-name" name="express-owner-name" required maxLength={100} />
                        </FormField>
                        <FormField id="express-owner-email" label="Correo electrónico">
                          <Input id="express-owner-email" name="express-owner-email" type="email" required />
                        </FormField>
                        <FormField id="express-owner-phone" label="WhatsApp">
                          <Input
                            id="express-owner-phone"
                            name="express-owner-phone"
                            type="tel"
                            required
                            placeholder="+5492494112233"
                            pattern="^\+[1-9]\d{9,14}$"
                          />
                        </FormField>
                      </fieldset>
                      <fieldset className="grid gap-4 border-t pt-5 md:grid-cols-3">
                        <legend className="sr-only">Paciente</legend>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:col-span-3" aria-hidden="true">
                          Paciente
                        </p>
                        <FormField id="express-pet-name" label="Nombre de la mascota">
                          <Input id="express-pet-name" name="express-pet-name" required maxLength={100} />
                        </FormField>
                        <FormField id="express-pet-species" label="Especie">
                          <Input id="express-pet-species" name="express-pet-species" required placeholder="perro / gato" maxLength={50} />
                        </FormField>
                        <FormField id="express-pet-breed" label="Raza (opcional)">
                          <Input id="express-pet-breed" name="express-pet-breed" maxLength={100} />
                        </FormField>
                      </fieldset>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Generar ficha y QR clínico
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Credencial generada (Alta Express) */}
              {altaExpressResult && (
                <Card className="border-primary/30 bg-secondary">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <QrCode className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-semibold tracking-wide text-foreground">
                            {altaExpressResult.qr_codigo}
                          </span>
                          <Badge variant="outline" className="rounded-full bg-card text-[11px] font-medium text-muted-foreground">
                            QR clínico · sin rastreo GPS
                          </Badge>
                        </div>
                        <p className="text-sm text-secondary-foreground">{altaExpressResult.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {altaExpressResult.pet_nombre} · Tutor: {altaExpressResult.owner_nombre} ({altaExpressResult.owner_email})
                        </p>
                      </div>
                    </div>

                    {altaExpressResult.activation_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-card"
                        onClick={() => {
                          if (altaExpressResult.activation_url) {
                            void navigator.clipboard.writeText(altaExpressResult.activation_url)
                            setCopiedActivationUrl(true)
                            setTimeout(() => setCopiedActivationUrl(false), 2500)
                          }
                        }}
                      >
                        {copiedActivationUrl ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copiedActivationUrl ? 'Enlace copiado' : 'Copiar acceso para WhatsApp'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Carga de estudio para la mascota seleccionada o recién creada */}
              {activeDiagnosticPet && (
                <Card>
                  <CardHeader className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
                      Cargar estudio para {activeDiagnosticPet.nombre}
                    </CardTitle>
                    <CardDescription>
                      Tutor: {activeDiagnosticPet.ownerName}
                      {activeDiagnosticPet.qrCodigo ? ` · QR ${activeDiagnosticPet.qrCodigo}` : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClinicalStudiesSection petId={activeDiagnosticPet.id} canUpload={true} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ==============================================================
         * TAB 3: MEDALLAS Y RASTREO
         * ============================================================ */}
        <TabsContent value="tracking" className="mt-0 flex flex-col gap-5">
          <SectionHeading
            icon={<MapPin className="h-5 w-5 text-primary" aria-hidden="true" />}
            title="Mapa de escaneos"
            description="Ubicaciones donde se escanearon medallas PetQR de tus pacientes. Excluye credenciales clínicas."
          />
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-3 p-0">
              <ScanMapProvider scans={data.scans} />
              {scansWithLocation.length === 0 && (
                <p className="px-5 pb-4 text-sm text-muted-foreground">
                  No hay escaneos con coordenadas para mostrar marcadores. El mapa está centrado en Tandil.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Medallas físicas vinculadas</CardTitle>
                <CardDescription>{physicalQrs.length} placas asociadas a tus pacientes</CardDescription>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  aria-label="Buscar medallas por código, mascota o cliente"
                  placeholder="Código, mascota o cliente"
                  value={qrSearch}
                  onChange={(event) => {
                    setQrSearch(event.target.value)
                    setQrPage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-y bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-6 py-3 font-medium">Código</th>
                      <th scope="col" className="px-4 py-3 font-medium">Mascota</th>
                      <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
                      <th scope="col" className="px-6 py-3 text-right font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visibleQrs.map((qr) => (
                      <tr key={qr.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-6 py-3 font-mono text-xs font-medium">{qr.codigo}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{qr.mascota_nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{qr.dueno_nombre}</td>
                        <td className="px-6 py-3 text-right">
                          {qr.activo ? (
                            <Badge variant="outline" className="rounded-full border-transparent bg-accent font-medium text-accent-foreground">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full font-medium text-muted-foreground">
                              Inactiva
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredQrs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                          No hay medallas físicas que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6">
                <PaginationControls
                  page={qrPage}
                  total={filteredQrs.length}
                  pageSize={qrPageSize}
                  onPageChange={setQrPage}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
