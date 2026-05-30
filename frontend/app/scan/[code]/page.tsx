'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea' 
import { Input } from '@/components/ui/input' // Para el formulario de alta
import {
  PawPrint, Phone, MessageCircle, MapPin, Calendar,
  Palette, FileText, AlertCircle, QrCode, Heart, Send, Loader2, User
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

  // 1. Función para enviar ubicación (se dispara sola si ya tiene dueño)
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

  // 2. Carga inicial de datos y Aduana
  useEffect(() => {
    async function initAduana() {
      try {
        setIsLoading(true)
        
        // Primero verificamos con tu endpoint de disponibilidad pública
        const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/qr/check/${code}`)
        const checkData = await checkRes.json()

        if (!checkRes.ok) {
          setError(checkData.message || "Error al leer el código QR")
          setIsLoading(false)
          return
        }

        if (checkData.available) {
          // CASO A: QR Virgen -> Habilitamos formulario de carga
          setIsAvailable(true)
          setIsLoading(false)
        } else if (checkData.has_pet) {
          // CASO B: QR Asignado -> Inicializamos tu flujo de escaneo y alertas
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
  }, [code, sendLocation])

  // 3. Función para enviar el mensaje manual (Flujo Reporte)
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

  // 4. Función para guardar y activar QR (Flujo Registro)
  const handleRegisterPet = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/qr/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Token del dueño logeado
        },
        body: JSON.stringify({
          codigo: code,
          ...formData
        })
      })

      const activationData = await res.json()

      if (res.ok) {
        toast.success("¡Medalla activada y mascota vinculada!")
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

  // --- RENDERS DE CONTROL ---
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-2" />
        <h2 className="text-xl font-bold text-foreground">Código Inválido</h2>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button asChild className="mt-4">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    )
  }

  // --- INTERFAZ 1: FORMULARIO DE ALTA (SI EL QR ESTÁ DISPONIBLE) ---
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
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nombre de la Mascota</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    required
                    placeholder="Ej: Rocco, Lola, Toby..."
                    className="pl-9"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Especie</label>
                  <select 
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.especie}
                    onChange={(e) => setFormData({...formData, especie: e.target.value})}
                  >
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Raza</label>
                  <Input 
                    placeholder="Mestizo, Ovejero..."
                    value={formData.raza}
                    onChange={(e) => setFormData({...formData, raza: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Notas importantes médicos / cuidados</label>
                <Textarea 
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

  // --- INTERFAZ 2: VISTA DE REPORTE PÚBLICO (SI EL QR TIENE DUEÑO - TU CÓDIGO ORIGINAL) ---
  const whatsappUrl = data?.owner?.telefono 
    ? `https://wa.me/${data.owner.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola! Encontré a ${data.pet.nombre}.`)}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 pb-10">
      {/* Header dinámico */}
      <div className={`${data?.pet.estado === 'PERDIDO' ? 'bg-destructive' : 'bg-primary'} text-white py-6 px-4 text-center`}>
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Heart className="fill-current" /> {data?.pet.nombre}
        </h1>
        <p className="opacity-90">{data?.pet.estado === 'PERDIDO' ? '¡ESTOY PERDIDO! AYÚDAME' : 'Mascota Protegida'}</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4 -mt-4">
        {/* Alerta de Ubicación */}
        {locationStatus === 'sent' && (
          <Alert className="bg-green-50 border-green-200">
            <MapPin className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">Tu ubicación fue enviada automáticamente al dueño.</AlertDescription>
          </Alert>
        )}

        {/* Tarjeta de Mascota */}
        <Card className="overflow-hidden">
          <div className="aspect-square relative bg-muted">
             {data?.pet.foto_url && <img src={data.pet.foto_url} alt="Pet" className="object-cover w-full h-full" />}
             <Badge className="absolute top-2 right-2">{data?.pet.raza || data?.pet.especie}</Badge>
          </div>
          <CardContent className="pt-4">
            {data?.pet.notas && (
              <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800"><strong>Importante:</strong> {data.pet.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 gap-3">
          <Button asChild size="lg" className="h-16 text-lg">
            <a href={`tel:${data?.owner.telefono}`}><Phone className="mr-2" /> Llamar al dueño</a>
          </Button>
          {whatsappUrl && (
            <Button asChild variant="outline" size="lg" className="h-16 text-lg border-green-500 text-green-600 hover:bg-green-50">
              <a href={whatsappUrl} target="_blank"><MessageCircle className="mr-2" /> Enviar WhatsApp</a>
            </Button>
          )}
        </div>

        {/* Formulario de Mensaje Extra */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">¿Ves algo más?</CardTitle>
            <CardDescription>Envía un mensaje rápido sobre el estado de la mascota.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea 
              placeholder="Ej: Está asustado bajo un auto rojo en la calle 9 de Julio..."
              value={extraMessage}
              onChange={(e) => setExtraMessage(e.target.value)}
              className="resize-none"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isSendingMessage || !extraMessage.trim()} 
              className="w-full flex items-center justify-center gap-2"
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