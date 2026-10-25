'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, ClipboardPlus, PawPrint, Pencil, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { veterinarianApi } from '@/lib/api/veterinarian'
import type {
  MedicalRecord,
  VeterinarianScannedPet,
} from '@/lib/types/veterinarian'

const PAGE_SIZE = 10

type MedicalRecordForm = {
  motivo_consulta: string
  diagnostico: string
  tratamiento: string
  peso_kg: string
  temperatura_c: string
}

const emptyForm: MedicalRecordForm = {
  motivo_consulta: '',
  diagnostico: '',
  tratamiento: '',
  peso_kg: '',
  temperatura_c: '',
}

function formFromRecord(record: MedicalRecord): MedicalRecordForm {
  return {
    motivo_consulta: record.motivo_consulta,
    diagnostico: record.diagnostico ?? '',
    tratamiento: record.tratamiento ?? '',
    peso_kg: record.peso_kg?.toString() ?? '',
    temperatura_c: record.temperatura_c?.toString() ?? '',
  }
}

export default function VeterinaryScanClinicalPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [pet, setPet] = useState<VeterinarianScannedPet | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [form, setForm] = useState<MedicalRecordForm>(emptyForm)

  useEffect(() => {
    let isCurrent = true

    async function loadClinicalFile() {
      if (!localStorage.getItem('token')) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(`/scan/${code}/clinical`)}`)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const { pet: scannedPet } = await veterinarianApi.getPetFromQr(code)
        const history = await veterinarianApi.getPetMedicalRecords(
          scannedPet.id,
          1,
          PAGE_SIZE,
        )
        if (!isCurrent) return
        setPet(scannedPet)
        setRecords(history.items)
        setPage(history.page)
        setTotalPages(history.pages)
        setTotalRecords(history.total)
      } catch (loadError) {
        if (!isCurrent) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar la ficha clínica.',
        )
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadClinicalFile()
    return () => {
      isCurrent = false
    }
  }, [code, router])

  async function loadHistoryPage(selectedPage: number) {
    if (!pet) return
    try {
      const history = await veterinarianApi.getPetMedicalRecords(
        pet.id,
        selectedPage,
        PAGE_SIZE,
      )
      setRecords(history.items)
      setPage(history.page)
      setTotalPages(history.pages)
      setTotalRecords(history.total)
    } catch (loadError) {
      toast.error(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar el historial clínico.',
      )
    }
  }

  async function handleSaveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pet) return

    const data = {
      motivo_consulta: form.motivo_consulta.trim(),
      diagnostico: form.diagnostico.trim() || null,
      tratamiento: form.tratamiento.trim() || null,
      peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
      temperatura_c: form.temperatura_c ? Number(form.temperatura_c) : null,
    }

    setIsSaving(true)
    try {
      if (editingRecordId) {
        await veterinarianApi.updateMedicalRecord(editingRecordId, data)
        toast.success('Historia clínica actualizada.')
      } else {
        await veterinarianApi.createMedicalRecord({
          mascota_id: pet.id,
          ...data,
        })
        toast.success('Consulta agregada a la historia clínica.')
      }
      setForm(emptyForm)
      setEditingRecordId(null)
      await loadHistoryPage(1)
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar la historia clínica.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  function startEditing(record: MedicalRecord) {
    setEditingRecordId(record.id)
    setForm(formFromRecord(record))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEditing() {
    setEditingRecordId(null)
    setForm(emptyForm)
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 p-4 py-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    )
  }

  if (error || !pet) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No se pudo abrir la ficha veterinaria</AlertTitle>
          <AlertDescription>
            {error ?? 'No hay una mascota disponible para este código QR.'}
            {' '}Verificá que la mascota esté vinculada a tu clínica o tenga un turno o una
            historia clínica previa.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/scan/${encodeURIComponent(code)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al escaneo
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 py-8">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={`/scan/${encodeURIComponent(code)}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al escaneo
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
            {pet.foto_url ? (
              <img src={pet.foto_url} alt={pet.nombre} className="h-full w-full object-cover" />
            ) : (
              <PawPrint className="h-9 w-9 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{pet.nombre}</h1>
            <p className="text-muted-foreground">
              {[pet.especie, pet.raza, pet.color].filter(Boolean).join(' · ')}
            </p>
            {pet.edad_aproximada && (
              <p className="text-sm text-muted-foreground">
                Edad aproximada: {pet.edad_aproximada}
              </p>
            )}
          </div>
          <Badge variant={pet.estado.toLowerCase() === 'perdido' ? 'destructive' : 'secondary'}>
            {pet.estado.replaceAll('_', ' ')}
          </Badge>
        </CardContent>
        {pet.notas && (
          <CardContent className="border-t pt-4">
            <p className="text-sm"><strong>Notas del dueño:</strong> {pet.notas}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingRecordId ? <Pencil className="h-5 w-5" /> : <ClipboardPlus className="h-5 w-5" />}
            {editingRecordId ? 'Editar consulta' : 'Registrar nueva consulta'}
          </CardTitle>
          <CardDescription>
            La consulta quedará asociada a tu clínica y a la ficha de {pet.nombre}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveRecord} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visit-reason">Motivo de consulta</Label>
              <Input
                id="visit-reason"
                required
                minLength={3}
                maxLength={255}
                value={form.motivo_consulta}
                onChange={(event) => setForm({ ...form, motivo_consulta: event.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visit-diagnosis">Diagnóstico</Label>
                <Textarea
                  id="visit-diagnosis"
                  value={form.diagnostico}
                  onChange={(event) => setForm({ ...form, diagnostico: event.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-treatment">Tratamiento</Label>
                <Textarea
                  id="visit-treatment"
                  value={form.tratamiento}
                  onChange={(event) => setForm({ ...form, tratamiento: event.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visit-weight">Peso (kg)</Label>
                <Input
                  id="visit-weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.peso_kg}
                  onChange={(event) => setForm({ ...form, peso_kg: event.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-temperature">Temperatura (°C)</Label>
                <Input
                  id="visit-temperature"
                  type="number"
                  min="30"
                  max="45"
                  step="0.1"
                  value={form.temperatura_c}
                  onChange={(event) => setForm({ ...form, temperatura_c: event.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving || !form.motivo_consulta.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : editingRecordId ? 'Guardar cambios' : 'Guardar consulta'}
              </Button>
              {editingRecordId && (
                <Button type="button" variant="outline" onClick={cancelEditing} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historia clínica</CardTitle>
          <CardDescription>
            {totalRecords} {totalRecords === 1 ? 'consulta registrada por tu clínica' : 'consultas registradas por tu clínica'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Todavía no hay consultas registradas por tu clínica para esta mascota.
            </p>
          ) : (
            records.map((record) => (
              <article key={record.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{record.motivo_consulta}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.fecha_consulta).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(record)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
                {(record.diagnostico || record.tratamiento || record.peso_kg != null || record.temperatura_c != null) && (
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {record.diagnostico && <p><strong>Diagnóstico:</strong> {record.diagnostico}</p>}
                    {record.tratamiento && <p><strong>Tratamiento:</strong> {record.tratamiento}</p>}
                    {record.peso_kg != null && <p><strong>Peso:</strong> {record.peso_kg} kg</p>}
                    {record.temperatura_c != null && <p><strong>Temperatura:</strong> {record.temperatura_c} °C</p>}
                  </div>
                )}
              </article>
            ))
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => void loadHistoryPage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => void loadHistoryPage(page + 1)}
                disabled={page >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
