'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  PawPrint,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Palette,
  FileText,
  AlertCircle,
  QrCode,
  Heart,
} from 'lucide-react'
import { scanQR } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Pet, QRCode } from '@/lib/types'

export default function ScanPage() {
  const params = useParams()
  const code = params.code as string

  const [data, setData] = useState<{ 
  pet: Pet; 
  owner: { nombre: string; telefono: string; } 
} | null>(null);

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationSent, setLocationSent] = useState(false)

  useEffect(() => {
    async function performScan() {
      try {
        // Try to get location
        let location: { lat: number; lng: number } | undefined

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              })
            })
            location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setLocationSent(true)
          } catch {
            // Location denied or unavailable, continue without it
            console.log('Location not available')
          }
        }

        const petData = await scanQR(code, location)
        setData(petData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Codigo QR no valido')
      } finally {
        setIsLoading(false)
      }
    }

    performScan()
  }, [code])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 p-4">
        <div className="max-w-md mx-auto pt-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Codigo QR no encontrado</h1>
                <p className="text-muted-foreground mt-2">
                  {error || 'Este codigo QR no esta registrado o ha sido desactivado'}
                </p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  Ir al inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const whatsappMessage = encodeURIComponent(
    `Hola! Encontre a ${data.pet.nombre}. Escanee el codigo QR de su collar.`
  )
  const whatsappUrl = data.owner?.telefono
    ? `https://wa.me/${data.owner.telefono.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">Mascota Encontrada</span>
          </div>
          <h1 className="text-2xl font-bold">Gracias por escanear</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Por favor contacta al dueno
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4 -mt-4">
        {/* Location Alert */}
        {locationSent && (
          <Alert className="bg-secondary/20 border-secondary">
            <MapPin className="w-4 h-4" />
            <AlertTitle>Ubicacion enviada</AlertTitle>
            <AlertDescription>
              El dueno ha sido notificado con tu ubicacion aproximada
            </AlertDescription>
          </Alert>
        )}

        {/* Pet Card */}
        <Card className="overflow-hidden">
          {/* Pet Photo */}
          <div className="aspect-video bg-muted relative">
            {data.pet.foto_url ? (
              <img
                src={data.pet.foto_url}
                alt={data.pet.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <PawPrint className="w-20 h-20 text-primary/30" />
              </div>
            )}
            <Badge className="absolute top-3 right-3 bg-primary">
              <PawPrint className="w-3 h-3 mr-1" />
              {data.pet.especie}
            </Badge>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{data.pet.nombre}</CardTitle>
            {data.pet.raza && (
              <CardDescription className="capitalize">
                {data.pet.raza}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pet Details */}
            <div className="grid grid-cols-2 gap-3">
              {data.pet.color && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Color</p>
                    <p className="text-sm font-medium">{data.pet.color}</p>
                  </div>
                </div>
              )}

              {data.pet.edad_aproximada && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nacimiento</p>
                    <p className="text-sm font-medium">{formatDate(data.pet.edad_aproximada)}</p>
                  </div>
                </div>
              )}
            </div>

            {data.pet.notas && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Informacion Medica Importante
                  </p>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {data.pet.notas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Contactar al Dueno</CardTitle>
            <CardDescription>
              {data.owner?.nombre || 'Dueno de ' + data.pet.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.owner?.telefono ? (
              <>
                <a href={`tel:${data.owner.telefono}`} className="block">
                  <Button className="w-full" size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    Llamar: {data.owner.telefono}
                  </Button>
                </a>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="secondary" className="w-full" size="lg">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Enviar WhatsApp
                    </Button>
                  </a>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  No hay numero de contacto disponible. El dueno sera notificado del escaneo.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <QrCode className="w-4 h-4" />
            Protegido por PetQR
          </Link>
        </div>
      </div>
    </div>
  )
}
