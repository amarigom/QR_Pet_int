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
import { petsApi } from '@/lib/api/pets'
import { qrApi } from '@/lib/api/qr'
import { formatDateTime } from '@/lib/utils'
import type { Pet, QRCode as QRCodeType, Scan } from '@/lib/types'
import { QRCodeDisplay } from '@/components/qr-code-display'
import PetImageUpload from '@/components/PetImageUpload'

export default function PetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params?.id as string

  const [pet, setPet] = useState<Pet | null>(null)
  const [qr, setQr] = useState<QRCodeType | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadPet() {
      if (!petId) return
      setIsLoading(true)
      
      try {
        const data = await petsApi.getById(petId)
        setPet(data)
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
    if (!petId) return
    setIsGenerating(true)
    try {
      const newQr = await qrApi.generate(petId)
      setQr(newQr)
      toast.success('Código QR generado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar QR')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDelete() {
    if (!petId) return
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
    if (!code) return
    const url = `${window.location.origin}/scan/${code}`
    navigator.clipboard.writeText(url)
    toast.success('Enlace copiado al portapapeles')
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <PawPrint className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-lg font-medium">No se encontró la mascota</p>
        <Link href="/dashboard/pets" className="mt-4 text-primary hover:text-primary/80 btn-transition font-medium">
          Volver al listado
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pets">
            <Button variant="ghost" size="icon" className="hover:bg-secondary/10 btn-transition">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{pet?.nombre || 'Sin nombre'}</h1>
            <p className="text-muted-foreground text-base capitalize">
              {pet?.especie} {pet?.raza && `• ${pet.raza}`}
            </p>
          </div>
          <Badge variant={pet?.estado === 'en_casa' ? 'default' : 'destructive'} className="ml-auto sm:ml-4 shadow-md">
            {pet?.estado === 'en_casa' ? '✓ En casa' : pet?.estado === 'perdido' ? '⚠ Perdido' : pet?.estado}
          </Badge>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 btn-transition">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar mascota</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminarán todos los datos y códigos QR de {pet?.nombre}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Info de Mascota */}
        <Card className="lg:col-span-2 border-border shadow-elevation-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-primary" />
              </div>
              Perfil de {pet?.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Image Upload */}
            <PetImageUpload
              petName={pet?.nombre || 'tu mascota'}
              initialImage={pet?.foto_url}
              onImageChange={(imageUrl) => {
                if (pet) {
                  setPet({ ...pet, foto_url: imageUrl })
                }
              }}
            />

            <Separator className="my-2" />

            {/* Detalles Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pet?.color && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-xl border border-border hover:border-secondary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shadow-sm">
                    <Palette className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">Color</p>
                    <p className="font-semibold text-foreground">{pet.color}</p>
                  </div>
                </div>
              )}

              {pet?.edad_aproximada && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">Edad</p>
                    <p className="font-semibold text-foreground">{pet.edad_aproximada}</p>
                  </div>
                </div>
              )}
            </div>

            {pet?.notas && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Notas Adicionales</p>
                </div>
                <p className="text-base leading-relaxed text-foreground bg-gradient-to-br from-muted/40 to-muted/20 p-4 rounded-xl border border-border">
                  {pet.notas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Columna Derecha: QR y Escaneos */}
        <div className="space-y-6">
          {/* QR Card */}
          <Card className="border-border shadow-elevation-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-5 h-5 text-primary" />
                Código QR
              </CardTitle>
              <CardDescription className="text-sm">
                Identificación digital de {pet?.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-center pb-6">
              {qr?.codigo && qr?.activo ? (
                <>
                  <QRCodeDisplay code={qr.codigo} petName={pet.nombre} />
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyQRLink(qr.codigo)}
                      className="hover:bg-secondary/10 btn-transition"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-secondary/10 btn-transition">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-secondary/40" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    Sin código QR activo
                  </p>
                  <Button 
                    onClick={handleGenerateQR} 
                    disabled={isGenerating} 
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:shadow-elevation-3 btn-transition"
                  >
                    {isGenerating ? 'Generando...' : 'Generar QR'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scans Card */}
          <Card className="border-border shadow-elevation-2">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-5 h-5 text-accent" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>{scans.length} escaneos registrados</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {scans.length === 0 ? (
                <div className="py-8 text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No se han registrado escaneos aún
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                    >
                      <MapPin className="w-4 h-4 text-accent mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {scan.direccion_aproximada || 'Ubicación no disponible'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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
