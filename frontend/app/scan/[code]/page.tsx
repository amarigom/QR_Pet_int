'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea' // Nuevo componente
import {
  PawPrint, Phone, MessageCircle, MapPin, Calendar,
  Palette, FileText, AlertCircle, QrCode, Heart, Send
} from 'lucide-react'
import { qrApi } from '@/lib/api/qr'
import { formatDate } from '@/lib/utils'
import type { Pet } from '@/lib/types'

export default function ScanPage() {
  const params = useParams()
  const code = params.code as string

  const [data, setData] = useState<{ pet: Pet; owner: { nombre: string; telefono: string; } } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para el flujo de reporte
  const [scanId, setScanId] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<'pending' | 'sent' | 'denied'>('pending')
  const [extraMessage, setExtraMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // 1. Función para enviar ubicación (se dispara sola)
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
      { enableHighAccuracy: true, timeout: 8000 } // Subimos timeout a 8s
    )
  }, [])

  // 2. Carga inicial de datos de la mascota
  useEffect(() => {
    async function initScan() {
      try {
        setIsLoading(true)
        // El backend ahora debería crear el scan vacío y devolver los datos de la mascota + el ID del scan
        const response = await qrApi.scan(code) 
        setData(response)
        setScanId(response.scan_id)
        
        // Disparamos la ubicación sin bloquear el render
        if (response.scan_id) sendLocation(response.scan_id)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Código no válido')
      } finally {
        setIsLoading(false)
      }
    }
    initScan()
  }, [code, sendLocation])

  // 3. Función para enviar el mensaje manual
  const handleSendMessage = async () => {
    if (!scanId || !extraMessage.trim()) return
    setIsSendingMessage(true)
    try {
      await qrApi.updateScanMessage(scanId, extraMessage)
      setExtraMessage('') // Limpiar tras enviar
      alert("Mensaje enviado al dueño. ¡Gracias!")
    } catch (e) {
      alert("Error al enviar el mensaje.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  // --- RENDERS (Loading y Error se mantienen similares) ---
  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>
  if (error || !data) return <div className="p-8 text-center">QR No válido</div>

  const whatsappUrl = data.owner?.telefono 
    ? `https://wa.me/${data.owner.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola! Encontré a ${data.pet.nombre}.`)}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-accent/5 pb-10">
      {/* Header con color dinámico según estado */}
      <div className={`${data.pet.estado === 'PERDIDO' ? 'bg-destructive' : 'bg-primary'} text-white py-6 px-4 text-center`}>
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Heart className="fill-current" /> {data.pet.nombre}
        </h1>
        <p className="opacity-90">{data.pet.estado === 'PERDIDO' ? '¡ESTOY PERDIDO! AYÚDAME' : 'Mascota Protegida'}</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4 -mt-4">
        {/* Alerta de Ubicación */}
        {locationStatus === 'sent' && (
          <Alert className="bg-green-50 border-green-200">
            <MapPin className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">Tu ubicación fue enviada automáticamente al dueño.</AlertDescription>
          </Alert>
        )}

        {/* Tarjeta de Mascota (Foto y Notas) */}
        <Card>
          <div className="aspect-square relative bg-muted">
             {data.pet.foto_url && <img src={data.pet.foto_url} alt="Pet" className="object-cover w-full h-full" />}
             <Badge className="absolute top-2 right-2">{data.pet.raza || data.pet.especie}</Badge>
          </div>
          <CardContent className="pt-4">
            {data.pet.notas && (
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
            <a href={`tel:${data.owner.telefono}`}><Phone className="mr-2" /> Llamar al dueño</a>
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
              className="w-full" 
              onClick={handleSendMessage} 
              disabled={isSendingMessage || !extraMessage.trim()}
            >
              {isSendingMessage ? "Enviando..." : "Enviar aviso al dueño"} <Send className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}