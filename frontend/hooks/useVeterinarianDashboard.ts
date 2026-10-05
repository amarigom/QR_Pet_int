'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { veterinarianApi } from '@/lib/api/veterinarian'
import type {
  AppointmentStatus,
  VeterinarianClientCreated,
  VeterinarianDashboardData,
} from '@/lib/types/veterinarian'

export function useVeterinarianDashboard() {
  const [data, setData] = useState<VeterinarianDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeklyAppointments, setWeeklyAppointments] = useState<VeterinarianDashboardData['appointments']>([])
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [appointmentsRefreshVersion, setAppointmentsRefreshVersion] = useState(0)
  const [createdClient, setCreatedClient] = useState<VeterinarianClientCreated | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await veterinarianApi.getDashboard())
    } catch (loadError) {
      const message = loadError instanceof Error
        ? loadError.message
        : 'No se pudo cargar el panel veterinario.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadWeeklyAppointments = useCallback(async (start: string, end: string) => {
    setAppointmentsError(null)
    try {
      setWeeklyAppointments(await veterinarianApi.getWeeklyAppointments(start, end))
    } catch (loadError) {
      const message = loadError instanceof Error
        ? loadError.message
        : 'No se pudo cargar la agenda semanal.'
      setAppointmentsError(message)
    }
  }, [])

  const refreshAfterAppointmentChange = useCallback(async () => {
    await reload()
    setAppointmentsRefreshVersion((version) => version + 1)
  }, [reload])

  useEffect(() => {
    void reload()
  }, [reload])

  const createAppointment = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!data) return

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const petId = String(form.get('appointment-pet') || '')
    const pet = data.available_pets.find((item) => item.id === petId)
    if (!pet) {
      toast.error('Seleccioná una mascota válida.')
      return
    }

    const start = new Date(String(form.get('appointment-start') || ''))
    const end = new Date(String(form.get('appointment-end') || ''))
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio.')
      return
    }

    setIsSubmitting(true)
    try {
      await veterinarianApi.createAppointment({
        mascota_id: pet.id,
        dueno_id: pet.usuario_id,
        fecha_hora_inicio: start.toISOString(),
        fecha_hora_fin: end.toISOString(),
        tipo_servicio: String(form.get('appointment-service') || '').trim(),
        observaciones: String(form.get('appointment-notes') || '').trim() || undefined,
      })
      toast.success('Turno creado.')
      formElement.reset()
      await refreshAfterAppointmentChange()
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'No se pudo crear el turno.')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, refreshAfterAppointmentChange])

  const createMedicalRecord = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const weight = String(form.get('medical-weight') || '')
    const temperature = String(form.get('medical-temperature') || '')

    setIsSubmitting(true)
    try {
      const record = await veterinarianApi.createMedicalRecord({
        mascota_id: String(form.get('medical-pet') || ''),
        motivo_consulta: String(form.get('medical-reason') || '').trim(),
        diagnostico: String(form.get('medical-diagnosis') || '').trim() || undefined,
        tratamiento: String(form.get('medical-treatment') || '').trim() || undefined,
        peso_kg: weight ? Number(weight) : undefined,
        temperatura_c: temperature ? Number(temperature) : undefined,
      })
      if (record.vectorizada) {
        toast.success('Historia clínica registrada y vectorizada.')
      } else {
        toast.warning('Historia clínica registrada, pero su vectorización quedó pendiente. Podés reintentar desde Conocimiento.')
      }
      formElement.reset()
      await refreshAfterAppointmentChange()
    } catch (submitError) {
      toast.error(submitError instanceof Error
        ? submitError.message
        : 'No se pudo guardar la historia clínica.')
    } finally {
      setIsSubmitting(false)
    }
  }, [refreshAfterAppointmentChange])

  const updateAppointmentStatus = useCallback(async (
    id: string,
    status: AppointmentStatus,
  ) => {
    setIsSubmitting(true)
    try {
      await veterinarianApi.updateAppointmentStatus(id, status)
      toast.success('Estado del turno actualizado.')
      await refreshAfterAppointmentChange()
    } catch (submitError) {
      toast.error(submitError instanceof Error
        ? submitError.message
        : 'No se pudo actualizar el turno.')
    } finally {
      setIsSubmitting(false)
    }
  }, [refreshAfterAppointmentChange])

  const createClient = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setIsSubmitting(true)
    setCreatedClient(null)
    try {
      const result = await veterinarianApi.createClient({
        nombre: String(form.get('client-name') || '').trim(),
        email: String(form.get('client-email') || '').trim(),
        telefono: String(form.get('client-phone') || '').trim(),
      })
      setCreatedClient(result)
      formElement.reset()
      if (result.whatsapp_sent) {
        toast.success('Cliente registrado y activación enviada por WhatsApp.')
      } else {
        toast.warning(result.message)
      }
      await reload()
    } catch (submitError) {
      toast.error(submitError instanceof Error
        ? submitError.message
        : 'No se pudo registrar el cliente.')
    } finally {
      setIsSubmitting(false)
    }
  }, [reload])

  const resendClientActivation = useCallback(async (clientId: string) => {
    setIsSubmitting(true)
    setCreatedClient(null)
    try {
      const result = await veterinarianApi.resendClientActivation(clientId)
      setCreatedClient(result)
      if (result.whatsapp_sent) {
        toast.success('Enlace de activación reenviado por WhatsApp.')
      } else {
        toast.warning(result.message)
      }
      await reload()
    } catch (submitError) {
      toast.error(submitError instanceof Error
        ? submitError.message
        : 'No se pudo reenviar la activación.')
    } finally {
      setIsSubmitting(false)
    }
  }, [reload])

  const uploadClinicLogo = useCallback(async (file: File) => {
    setIsSubmitting(true)
    try {
      await veterinarianApi.uploadClinicLogo(file)
      toast.success('Logo institucional actualizado.')
      await reload()
    } catch (submitError) {
      toast.error(submitError instanceof Error
        ? submitError.message
        : 'No se pudo guardar el logo.')
    } finally {
      setIsSubmitting(false)
    }
  }, [reload])

  const deleteAppointment = useCallback(async (id: string) => {
    setIsSubmitting(true)
    try {
      await veterinarianApi.deleteAppointment(id)
      toast.success('Turno eliminado del calendario.')
      await refreshAfterAppointmentChange()
    } catch (submitError) {
      toast.error(submitError instanceof Error
        ? submitError.message
        : 'No se pudo eliminar el turno.')
    } finally {
      setIsSubmitting(false)
    }
  }, [refreshAfterAppointmentChange])

  return {
    data,
    isLoading,
    isSubmitting,
    error,
    weeklyAppointments,
    appointmentsError,
    appointmentsRefreshVersion,
    createdClient,
    reload,
    loadWeeklyAppointments,
    createAppointment,
    createMedicalRecord,
    updateAppointmentStatus,
    deleteAppointment,
    createClient,
    resendClientActivation,
    uploadClinicLogo,
  }
}
