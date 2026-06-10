'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Componentes de tu carpeta UI utilizados para simplificar y estilizar
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea' 
import { Input } from '@/components/ui/input' 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import {
  PawPrint, Phone, MessageCircle, MapPin, 
  AlertCircle, QrCode, Heart, Send, Loader2
} from 'lucide-react'
import { qrApi } from '@/lib/api/qr'
import { toast } from 'sonner'
import type { Pet } from '@/lib/types'

export default function ScanPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  // Estados de control de la Aduana
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null) 
  const [data, setData] = useState<{ pet: Pet; owner: { nombre: string; telefono: string; } } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para el flujo de reporte (Mascota con dueño)
  const [scanId, setScanId] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<'pending' | 'sent' | 'denied'>('pending')
  const [extraMessage, setExtraMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // Estados para el flujo de registro (Mascota nueva)
  const [formData, setFormData] = useState({
    nombre: '',
    especie: 'perro',
    raza: '',
    notas: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // 1. Envío de ubicación automática
  const sendLocation = useCallback(async (id: string) => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await qrApi.updateScanLocation(id, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
          setLocationStatus('sent')
        } catch (e) {
          console.error("Error actualizando ubicación", e)
        }
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  // 2. Carga inicial y Aduana pública/privada
  useEffect(() => {
    async function initAduana() {
      try {
        setIsLoading(true)
        
        const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qr/check/${code}`)
        const checkData = await checkRes.json()

        if (!checkRes.ok) {
          setError(checkData.message || "Error al leer el código QR")
          setIsLoading(false)
          return
        }

        if (checkData.available) {
          const token = localStorage.getItem('token')
          if (!token) {
            toast.error("Debes iniciar sesión para registrar una medalla nueva.")
            router.push(`/auth/login?redirect=/scan/${code}`)
            return
          }

          setIsAvailable(true)
          setIsLoading(false)
        } else if (checkData.has_pet) {
          setIsAvailable(false)
          const response = await qrApi.scan(code) 
          setData(response)
          setScanId(response.scan_id)
          
          if (response.scan_id) sendLocation(response.scan_id)
          setIsLoading(false)
        } else {
          setError("Código no válido o inactivo")
          setIsLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión con el servidor')
        setIsLoading(false)
      }
    }
    
    if (code) initAduana()
  }, [code, sendLocation, router])

  // 3. Enviar mensaje manual al dueño
  const handleSendMessage = async () => {
    if (!scanId || !extraMessage.trim()) return
    setIsSendingMessage(true)
    try {
      await qrApi.updateScanMessage(scanId, extraMessage)
      setExtraMessage('') 
      toast.success("Mensaje enviado al dueño. ¡Gracias!")
    } catch (e) {
      toast.error("Error al enviar el mensaje.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  // 4. Guardar y activar QR (Vincular mascota)
  const handleRegisterPet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error("Tu sesión expiró. Por favor, iniciá sesión nuevamente.")
      router.push(`/auth/login?redirect=/scan/${code}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qr/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo: code,
          ...formData
        })
      })

      const activationData = await res.json()

      if (res.ok) {
        toast.success("¡Medalla activada y mascota vinculada con éxito!")
        router.push('/dashboard')
      } else {
        toast.error(activationData.message || "No se pudo activar la medalla.")
      }
    } catch (err) {
      toast.error("Error de red al intentar registrar.")
    } finally {
      setSubmitting(false)
    }
  }

  // --- RENDERS DE CONTROL (Simplificados con tus UI Skeletons) ---
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6 mt-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Código Inválido</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    )
  }

  // --- INTERFAZ 1: FORMULARIO DE ALTA (Mejorado con Select y Label de tu carpeta UI) ---
  if (isAvailable) {
    return (
      <div className="min-h-screen bg-muted/30 pb-10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/5 border-b pb-4">
            <div className="flex items-center gap-2 text-primary">
              <QrCode className="w-5 h-5" />
              <Badge variant="secondary">¡Medalla Nueva!</Badge>
            </div>
            <CardTitle className="text-xl mt-2 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" /> Registrar Mascota
            </CardTitle>
            <CardDescription>
              Vinculá el código <span className="font-mono font-bold text-foreground">{code}</span> a un nuevo perfil.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleRegisterPet} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Nombre de la Mascota</Label>
                <div className="relative">
                  <Heart className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="nombre"
                    required
                    placeholder="Ej: Rocco, Lola, Toby..."
                    className="pl-9"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Especie</Label>
                  <Select 
                    value={formData.especie} 
                    onValueChange={(value) => setFormData({...formData, especie: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Especie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro">Perro</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="raza" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Raza</Label>
                  <Input 
                    id="raza"
                    placeholder="Mestizo, Ovejero..."
                    value={formData.raza}
                    onChange={(e) => setFormData({...formData, raza: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notas" className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Notas Médicas / Cuidados</Label>
                <Textarea 
                  id="notas"
                  placeholder="Ej: Es alérgico a la penicilina y requiere medicación diaria..."
                  className="resize-none"
                  value={formData.notas} 
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activando Chapita Inteligente...
                  </>
                ) : (
                  "Activar Medalla y Guardar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- INTERFAZ 2: VISTA DE REPORTE PÚBLICO (Con protección de foto contra textos basura como "string") ---
  const whatsappUrl = data?.owner?.telefono 
    ? `https://wa.me/${data.owner.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola! Encontré a ${data.pet.nombre}.`)}`
    : null

  // Protección robusta de renderizado de imagen de mascota
  const tieneFotoValida = data?.pet.foto_url && data.pet.foto_url !== 'string' && data.pet.foto_url.trim() !== ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 pb-10">
      <div className={`${data?.pet.estado === 'PERDIDO' ? 'bg-destructive' : 'bg-primary'} text-white py-6 px-4 text-center`}>
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Heart className="fill-current" /> {data?.pet.nombre}
        </h1>
        <p className="opacity-90">{data?.pet.estado === 'PERDIDO' ? '¡ESTOY PERDIDO! AYÚDAME' : 'Mascota Protegida'}</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4 -mt-4">
        {locationStatus === 'sent' && (
          <Alert className="bg-green-50 border-green-200">
            <MapPin className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">
              Tu ubicación fue enviada automáticamente al dueño.
            </AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden shadow-md">
          <div className="aspect-square relative bg-muted flex items-center justify-center">
            {tieneFotoValida ? (
              <img 
                src={data?.pet.foto_url?? undefined} 
                alt={data?.pet.nombre} 
                className="object-cover w-full h-full" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 text-muted-foreground/40">
                <PawPrint className="w-20 h-20 text-primary/20 mb-2" />
                <span className="text-xs font-medium">Sin foto de perfil</span>
              </div>
            )}
            <Badge className="absolute top-2 right-2 shadow-sm capitalize">
              {data?.pet.raza || data?.pet.especie}
            </Badge>
          </div>
          
          <CardContent className="pt-4">
            {data?.pet.notas && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  <strong className="font-bold">Importante:</strong> {data.pet.notas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <Button asChild size="lg" className="h-16 text-lg font-semibold shadow-md">
            <a href={`tel:${data?.owner.telefono}`}>
              <Phone className="mr-2 w-5 h-5" /> Llamar al dueño
            </a>
          </Button>
          {whatsappUrl && (
            <Button asChild variant="outline" size="lg" className="h-16 text-lg font-semibold border-green-500 text-green-600 hover:bg-green-50/50 shadow-sm bg-background">
              <a href={whatsappUrl} target="_blank">
                <MessageCircle className="mr-2 w-5 h-5" /> Enviar WhatsApp
              </a>
            </Button>
          )}
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">¿Ves algo más?</CardTitle>
            <CardDescription>Envía un mensaje rápido sobre el estado o ubicación de la mascota.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea 
              placeholder="Ej: Está asustado bajo un auto rojo en la calle 9 de Julio..."
              value={extraMessage}
              onChange={(e) => setExtraMessage(e.target.value)}
              className="resize-none min-h-[80px]"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isSendingMessage || !extraMessage.trim()} 
              className="w-full h-10 font-medium flex items-center justify-center gap-2"
            >
              {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Mensaje de Reporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}