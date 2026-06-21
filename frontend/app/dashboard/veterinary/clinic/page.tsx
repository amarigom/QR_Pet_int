'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Stethoscope, MapPin, Phone, Mail, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/app/context/auth/AuthContext'
import { useRouter } from 'next/navigation'

export default function ClinicPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [clinic, setClinic] = useState<any>(null)

  useEffect(() => {
    if (user?.rol !== 'veterinario') {
      router.push('/dashboard')
      return
    }

    // TODO: Fetch clinic data from API
    // const loadClinic = async () => {
    //   try {
    //     const data = await veterinaryApi.getMyClinic()
    //     setClinic(data)
    //   } catch (error) {
    //     console.error('Error loading clinic:', error)
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // loadClinic()

    setIsLoading(false)
  }, [user, router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-primary" />
            Mi Clínica Veterinaria
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona tu clínica y equipo</p>
        </div>
        <Link href="/dashboard/veterinary/clinic/edit">
          <Button>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Clínica
          </Button>
        </Link>
      </div>

      {clinic ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="text-lg font-semibold">{clinic.nombre}</p>
              </div>
              <div className="space-y-2">
                {clinic.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{clinic.direccion}</span>
                  </div>
                )}
                {clinic.ciudad && (
                  <div className="text-sm text-muted-foreground ml-6">{clinic.ciudad}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clinic.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${clinic.telefono}`} className="text-sm hover:underline">
                    {clinic.telefono}
                  </a>
                </div>
              )}
              {clinic.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${clinic.email}`} className="text-sm hover:underline">
                    {clinic.email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No tienes una clínica registrada aún</p>
            <Link href="/dashboard/veterinary/clinic/new">
              <Button>Crear Clínica</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipo Veterinario</CardTitle>
          <CardDescription>Gestiona los veterinarios de tu clínica</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {/* TODO: List veterinarians */}
            <p>Tu equipo aparecerá aquí</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
