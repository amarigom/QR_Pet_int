'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ShieldCheck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function PublicScanPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendLocation = () => {
    setLoading(true)

    if (!("geolocation" in navigator)) {
      toast.error("Tu navegador no soporta geolocalización")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Aquí llamamos a tu API de FastAPI
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scans/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qr_id: id,
              latitud: latitude,
              longitud: longitude,
              //fecha_escaneo: new Date().toISOString()
            }),
          })

          if (response.ok) {
            setSent(true)
            toast.success("¡Ubicación enviada al dueño!")
          } else {
            throw new Error("Error en el servidor")
          }
        } catch (error) {
          toast.error("No se pudo enviar la ubicación")
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        toast.error("Debes permitir el acceso al GPS para ayudar")
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">¡Mascota Encontrada!</CardTitle>
          <p className="text-muted-foreground">Estás escaneando el código de una mascota protegida por PetQR.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!sent ? (
            <>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                <AlertTriangle className="w-12 h-12 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-800">
                  Para ayudar al dueño a recuperar su mascota, por favor compartí tu ubicación actual.
                </p>
              </div>
              <Button 
                onClick={handleSendLocation} 
                disabled={loading}
                className="w-full h-16 text-lg font-bold shadow-md hover:scale-[1.02] transition-transform"
              >
                {loading ? "Obteniendo GPS..." : "📍 Compartir Ubicación"}
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-green-500 font-bold text-xl mb-2">¡Gracias por ayudar!</div>
              <p className="text-slate-600">El dueño ya recibió la notificación con la ubicación de la mascota.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}