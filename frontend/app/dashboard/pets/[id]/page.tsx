'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Componentes UI de tu carpeta local
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

// Iconos y librerías externas
import {
  ArrowLeft,
  PawPrint,
  QrCode,
  Calendar,
  Palette,
  FileText,
  Trash2,
  MapPin,
  Copy,
  Edit2,
  Save,
  X,
  Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import { petsApi } from '@/lib/api/pets'
import { formatDateTime } from '@/lib/utils'
import type { Pet, PetFormData, QRCode as QRCodeType, Scan } from '@/lib/types'

export default function PetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params?.id as string

  const [pet, setPet] = useState<Pet | null>(null)
  const [qr, setQr] = useState<QRCodeType | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados locales para la gestión de cambios y formularios
  const [isEditingData, setIsEditingData] = useState(false)
  const [isSavingData, setIsSavingData] = useState(false)
  const [tempFotoUrl, setTempFotoUrl] = useState('')
  const [formData, setFormData] = useState({
    color: '',
    edad_aproximada: '',
    notas: '',
    estado: 'en_casa',
    foto_url: ''
  })

  useEffect(() => {
    async function loadPet() {
      if (!petId) return
      setIsLoading(true)
      
      try {
        const data = await petsApi.getById(petId)
        setPet(data)
        
        setFormData({
          color: data.color || '',
          edad_aproximada: data.edad_aproximada || '',
          notas: data.notas || '',
          estado: (data as any).estado || 'en_casa', 
          foto_url: data.foto_url || ''
        })
        setTempFotoUrl(data.foto_url || '')

        if ((data as any).qr_code) setQr((data as any).qr_code)
        if ((data as any).scans) setScans((data as any).scans)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSaveChanges() {
    if (!petId || !pet) return
    setIsSavingData(true)
    try {
      const payload: PetFormData = {
        nombre: pet.nombre,              
        especie: pet.especie,            
        raza: pet.raza || null,
        color: formData.color || null,
        edad_aproximada: formData.edad_aproximada || null,
        foto_url: formData.foto_url || null,
        notas: formData.notas || null,   
      }

      const updatedPet = await petsApi.update(petId, payload)
      
      setPet(updatedPet)
      setFormData({
        color: updatedPet.color || '',
        edad_aproximada: updatedPet.edad_aproximada || '',
        notas: updatedPet.notas || '',
        estado: updatedPet.estado || 'en_casa',
        foto_url: updatedPet.foto_url || ''
      })
      
      setIsEditingData(false)
      toast.success('Mascota actualizada correctamente')
    } catch (error) {
      console.error('Error updating pet:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar los cambios')
    } finally {
      setIsSavingData(false)
    }
  }

  function handleCancelEdit() {
    if (pet) {
      setFormData({
        color: pet.color || '',
        edad_aproximada: pet.edad_aproximada || '',
        notas: pet.notas || '',
        estado: pet.estado || 'en_casa',
        foto_url: pet.foto_url || ''
      })
      setTempFotoUrl(pet.foto_url || '')
    }
    setIsEditingData(false)
  }

  async function handleDelete() {
    if (!petId) return
    setIsDeleting(true)
    try {
      await petsApi.delete(petId)
      toast.success('Mascota almacenada o eliminada')
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
      
      {/* Cabecera de la Ficha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link href="/dashboard/pets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{pet.nombre || 'Sin nombre'}</h1>
            <p className="text-muted-foreground capitalize text-sm truncate">
              {pet.especie} {pet.raza && `- ${pet.raza}`}
            </p>
          </div>

          {/* Selector Dinámico de Estado */}
          {isEditingData ? (
            <select
              name="estado"
              value={formData.estado}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              onChange={handleInputChange}
            >
              <option value="en_casa">En casa</option>
              <option value="perdido">Perdido</option>
            </select>
          ) : (
            <Badge variant={pet.estado === 'en_casa' ? 'default' : 'destructive'} className="shrink-0">
              {pet.estado === 'en_casa' ? 'En casa' : pet.estado === 'perdido' ? 'Perdido' : pet.estado}
            </Badge>
          )}
        </div>

        {/* Botonera de flujo de Estados */}
        <div className="flex items-center gap-2 justify-end">
          {isEditingData ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSavingData}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveChanges} disabled={isSavingData}>
                <Save className="w-4 h-4 mr-2" />
                {isSavingData ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditingData(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Datos
              </Button>

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
        Esta acción no se puede deshacer. Se eliminarán todos los datos y códigos QR de {pet.nombre}.
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
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Información Detallada */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              Información de la Mascota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Foto con capa interactiva de Edición */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted relative group border">
              {formData.foto_url ? (
                <img
                  src={formData.foto_url}
                  alt={pet.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                  <PawPrint className="w-24 h-24 text-primary/20" />
                </div>
              )}

              {isEditingData && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 cursor-pointer text-white font-medium text-sm animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      Cambiar Enlace de Foto
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Actualizar foto de la mascota</DialogTitle>
                      <DialogDescription>
                        Pegá la URL directa de la nueva imagen.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <Input
                        type="url"
                        placeholder="https://ejemplo.com/foto.jpg"
                        value={tempFotoUrl}
                        onChange={(e) => setTempFotoUrl(e.target.value)}
                      />
                    </div>
                    <DialogFooter className="sm:justify-end gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setTempFotoUrl(formData.foto_url)}>
                        Cancelar
                      </Button>
                      <DialogClose asChild>
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={() => setFormData({ ...formData, foto_url: tempFotoUrl })}
                        >
                          Confirmar Foto
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Atributos: Color y Edad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm shrink-0">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Color</p>
                  {isEditingData ? (
                    <Input
                      name="color"
                      value={formData.color}
                      className="h-8 text-xs mt-1 bg-background"
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="font-medium truncate">{formData.color || 'No especificado'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm shrink-0">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Edad Aproximada</p>
                  {isEditingData ? (
                    <Input
                      name="edad_aproximada"
                      value={formData.edad_aproximada}
                      className="h-8 text-xs mt-1 bg-background"
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="font-medium truncate">{formData.edad_aproximada || 'No especificada'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Comentarios / Notas */}
            <div className="space-y-2 pt-2">
              <Separator className="my-4" />
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Notas Adicionales / Comentarios</p>
              </div>
              
              {isEditingData ? (
                <Textarea
                  name="notas"
                  value={formData.notas}
                  rows={4}
                  placeholder="Indicaciones médicas, temperamento, teléfonos de respaldo..."
                  className="text-sm mt-2 bg-background"
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded-lg border border-muted min-h-[40px]">
                  {formData.notas || 'Sin notas adicionales asociadas.'}
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Columna Derecha: Trazabilidad y Panel de Escaneos */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/[0.03]">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Identificador del Collar
              </CardTitle>
              <CardDescription>
                Código único de hardware y estado de asignación digital
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {qr?.codigo ? (
                <div className="space-y-4">
                  {/* Caja de Datos Técnicos en lugar del Dibujo QR */}
                  <div className="p-4 bg-muted/40 rounded-xl border border-muted/70 text-left space-y-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Código de Trazabilidad</p>
                      <code className="text-xs font-mono font-bold block mt-0.5 bg-background border px-2 py-1 rounded text-primary select-all break-all">
                        {qr.codigo}
                      </code>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground font-medium">Estado del dispositivo:</span>
                      <Badge variant={qr.activo ? "outline" : "secondary"} className={qr.activo ? "text-green-600 border-green-200 bg-green-50" : ""}>
                        {qr.activo ? "Vinculado y Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  {/* Único botón disponible: Copiar Link de Escaneo */}
                  <Button variant="outline" size="sm" className="w-full shadow-sm" onClick={() => copyQRLink(qr.codigo)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Enlace de Ficha Pública
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Dispositivo no verificado</p>
                  <p className="text-xs text-muted-foreground/70 max-w-[200px] mx-auto mt-1">
                    Esta mascota no cuenta con un identificador homologado en el sistema.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Actividad / Escaneos */}
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