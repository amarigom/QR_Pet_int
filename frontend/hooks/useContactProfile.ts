'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import type { User } from '@/lib/types/auth'

interface ContactProfile {
  nombre: string
  telefono: string
  whatsapp_recordatorios_consent: boolean
}

export function useContactProfile(user: User) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(user)
  const [profileData, setProfileData] = useState<ContactProfile>({
    nombre: user.nombre || '',
    telefono: user.telefono || '',
    whatsapp_recordatorios_consent: user.whatsapp_recordatorios_consent || false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setCurrentUser(user)
    setProfileData({
      nombre: user.nombre || '',
      telefono: user.telefono || '',
      whatsapp_recordatorios_consent: user.whatsapp_recordatorios_consent || false,
    })
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nombre = profileData.nombre.trim()
    const telefono = profileData.telefono.trim()
    if (!nombre || !telefono) {
      toast.error('Por favor, completa todos los campos.')
      return
    }

    let cleanPhone = telefono.replace(/[^\d+]/g, '')
    if (!cleanPhone.startsWith('+')) cleanPhone = `+${cleanPhone}`

    if (!/^\+[1-9]\d{9,14}$/.test(cleanPhone)) {
      toast.error('Número inválido. Usa formato internacional (ej: +5492494112233).')
      return
    }

    setIsSaving(true)
    try {
      const updatedUser = await authApi.updateProfile({
        nombre,
        telefono: cleanPhone,
        whatsapp_recordatorios_consent: profileData.whatsapp_recordatorios_consent,
      })
      setCurrentUser(updatedUser)
      setProfileData({
        nombre: updatedUser.nombre,
        telefono: updatedUser.telefono || '',
        whatsapp_recordatorios_consent: updatedUser.whatsapp_recordatorios_consent,
      })
      toast.success('¡Datos de contacto guardados!')
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar contacto')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    currentUser,
    profileData,
    setProfileData,
    isSaving,
    isDialogOpen,
    setIsDialogOpen,
    handleSubmit,
  }
}
