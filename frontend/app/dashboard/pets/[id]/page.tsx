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

export default function PetDetailPage() {
  const params = useParams()
  const router = useRouter()
  // Usamos un fallback por si params.id no está disponible inmediatamente
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
    setIsLoading(true) // Asegúrate de que empiece en true
    
    try {
      const data = await petsApi.getById(petId)
      
      // GUARDAR LOS DATOS (Esto es lo que faltaba)
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
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  // Si no hay mascota después de cargar, mostramos un aviso en lugar de pantalla en blanco
  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No se encontró la mascota solicitada.</p>
        <Link href="/dashboard/pets" className="mt-4 text-primary hover:underline">
          Volver al listado
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{pet?.nombre || 'Sin nombre'}</h1>
            <p className="text-muted-foreground capitalize text-sm">
              {pet?.especie} {pet?.raza && `- ${pet.raza}`}
            </p>
          </div>
          <Badge variant={pet?.estado === 'en_casa' ? 'default' : 'destructive'}>
            {pet?.estado === 'en_casa' ? 'En casa' : pet?.estado === 'perdido' ? 'Perdido' : pet?.estado}
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              Información de la Mascota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
              {pet?.foto_url ? (
                <img
                  src={pet.foto_url}
                  alt={pet.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                  <PawPrint className="w-24 h-24 text-primary/20" />
                </div>
              )}
            </div>

            {/* Detalles Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pet?.color && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Color</p>
                    <p className="font-medium">{pet.color}</p>
                  </div>
                </div>
              )}

              {pet?.edad_aproximada && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Edad</p>
                    <p className="font-medium">{pet.edad_aproximada}</p>
                  </div>
                </div>
              )}
            </div>

            {pet?.notas && (
              <div className="space-y-2 pt-2">
                <Separator className="my-4" />
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Notas Adicionales</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded-lg border border-muted">
                  {pet.notas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Columna Derecha: QR y Escaneos */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/[0.03]">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Código QR
              </CardTitle>
              <CardDescription>
                Identificación digital para el collar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-center">
              {qr?.codigo && qr?.activo ? (
                <>
                  <QRCodeDisplay code={qr.codigo} petName={pet.nombre} />
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyQRLink(qr.codigo)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Imagen
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sin código QR activo
                  </p>
                  <Button onClick={handleGenerateQR} disabled={isGenerating} className="w-full">
                    {isGenerating ? 'Generando...' : 'Generar QR Ahora'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-primary" />
                Actividad Reciente ({scans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 italic">
                  No se han registrado escaneos aún
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-start gap-3 p-2 rounded-lg bg-muted/40 border border-transparent hover:border-muted transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {scan.direccion_aproximada || 'Ubicación no disponible'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
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