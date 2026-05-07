'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  PawPrint,
  QrCode,
  Calendar,
  Palette,
  FileText,
  Download,
  Trash2,
  MapPin,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { petsApi, qrApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils'
import type { Pet, QRCode as QRCodeType, Scan } from '@/lib/types'
import { QRCodeDisplay } from '@/components/qr-code-display'

export default function PetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params.id as string

  const [pet, setPet] = useState<Pet | null>(null)
  const [qr, setQr] = useState<QRCodeType | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadPet() {
      try {
        const data = await petsApi.getById(petId)
        setPet(data.pet)
        setQr(data.qr)
        setScans(data.scans || [])
      } catch (error) {
        console.error('Error loading pet:', error)
        toast.error('Error al cargar la mascota')
        router.push('/dashboard/pets')
      } finally {
        setIsLoading(false)
      }
    }
    loadPet()
  }, [petId, router])

  async function handleGenerateQR() {
    setIsGenerating(true)
    try {
      const newQr = await qrApi.generate(petId)
      setQr(newQr)
      toast.success('Codigo QR generado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar QR')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await petsApi.delete(petId)
      toast.success('Mascota eliminada')
      router.push('/dashboard/pets')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    } finally {
      setIsDeleting(false)
    }
  }

  function copyQRLink(code: string) {
    const url = `${window.location.origin}/scan/${code}`
    navigator.clipboard.writeText(url)
    toast.success('Enlace copiado al portapapeles')
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!pet) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{pet.nombre}</h1>
            <p className="text-muted-foreground capitalize">
              {pet.especie} {pet.raza && `- ${pet.raza}`}
            </p>
          </div>
          <Badge variant={pet.estado === 'en_casa' ? 'default' : 'destructive'}>
            {pet.estado === 'en_casa' ? 'En casa' : pet.estado === 'perdido' ? 'Perdido' : pet.estado}
          </Badge>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar mascota</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminaran todos los datos y codigos QR de {pet.nombre}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pet Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5" />
              Informacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {pet.foto_url ? (
                <img
                  src={pet.foto_url}
                  alt={pet.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                  <PawPrint className="w-24 h-24 text-primary/30" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              {pet.color && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{pet.color}</p>
                  </div>
                </div>
              )}

              {pet.edad_aproximada && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Edad</p>
                    <p className="font-medium">{pet.edad_aproximada}</p>
                  </div>
                </div>
              )}
            </div>

            {pet.notas && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Notas</p>
                  </div>
                  <p className="text-muted-foreground">{pet.notas}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Codigo QR
              </CardTitle>
              <CardDescription>
                Imprime este codigo y colocalo en el collar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qr && qr.activo ? (
                <>
                  <QRCodeDisplay code={qr.codigo} petName={pet.nombre} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyQRLink(qr.codigo)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Esta mascota no tiene codigo QR activo
                  </p>
                  <Button onClick={handleGenerateQR} disabled={isGenerating}>
                    {isGenerating ? 'Generando...' : 'Generar QR'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Escaneos ({scans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aun no hay escaneos registrados
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {scans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <MapPin className="w-4 h-4 text-secondary-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {scan.direccion_aproximada || 'Sin ubicacion'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(scan.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
