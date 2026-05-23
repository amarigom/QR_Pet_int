
"use client" // Clave: manejamos hardware (cámara) y ciclo de vida en el cliente

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { QrCode, X, Camera } from 'lucide-react'
import { toast } from 'sonner'

export default function QrScannerModal() {
const [isOpen, setIsOpen] = useState(false)
const router = useRouter()

useEffect(() => {
    if (!isOpen) return

    const elementId = "reader-container"
    let html5QrcodeScanner: Html5Qrcode | null = null

    // Inicializamos la instancia limpia sin la interfaz por defecto rústica
    html5QrcodeScanner = new Html5Qrcode(elementId)

    // Éxito: Qué hace la app cuando detecta el QR
    const onScanSuccess = (decodedText: string) => {
    try {
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop().then(() => {
            setIsOpen(false)
            toast.success("¡Código QR detectado con éxito!")

            if (decodedText.includes('/scan/')) {
            const parts = decodedText.split('/scan/')
            const qrId = parts[parts.length - 1]
            router.push(`/scan/${qrId}`)
            } else {
            router.push(`/scan/${decodedText.trim()}`)
            }
        }).catch((err) => console.error("Error al detener la cámara:", err))
        }
    } catch (err) {
        console.error("Error al procesar el éxito del escaneo:", err)
    }
    }

    // Falla: Corre en silencio buscando el foco
    const onScanFailure = (error: any) => {}

    // Pedimos las cámaras de forma explícita para gatillar el permiso directo del celular
    Html5Qrcode.getCameras()
    .then((devices) => {
        if (devices && devices.length > 0) {
          // Intentamos priorizar de forma inteligente la cámara trasera
        const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('trasera') ||
            device.label.toLowerCase().includes('environment')
        )

        const cameraId = backCamera ? backCamera.id : devices[0].id

          // Encendemos la cámara automáticamente sin botones intermediarios
        html5QrcodeScanner?.start(
            cameraId,
            {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
            },
            onScanSuccess,
            onScanFailure
        ).catch((err) => {
            console.error("Error al arrancar el flujo de video:", err)
        })
        } else {
        toast.error("No se encontraron cámaras disponibles en este dispositivo.")
        }
    })
    .catch((err) => {
        console.error("Error de permisos u obtención de hardware:", err)
        toast.error("Permiso de cámara denegado. Comprobá los ajustes de tu navegador.")
    })

    // Limpieza automática por si el usuario cierra el modal repentinamente
    return () => {
    if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop().catch((err) => console.log("Cámara liberada en desmonte", err))
    }
    }
}, [isOpen, router])

return (
    <>
      {/* Botón Principal Estilo Mercado Pago */}
    <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center bg-primary hover:bg-primary/90 transition-all hover:scale-110 z-50 animate-bounce"
        title="Escanear Medalla"
    >
        <QrCode className="w-8 h-8 text-white" />
    </Button>

      {/* Ventana Flotante (Modal) del Escáner */}
    {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Cabecera del Escáner */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Escaneá el código de la medalla</span>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            </div>

            {/* Contenedor del Visor de la Cámara */}
            <div className="p-6 bg-black flex justify-center items-center">
            <div 
                id="reader-container" 
                className="w-full rounded-xl overflow-hidden border border-slate-800 [&_video]:rounded-xl [&_a]:hidden bg-slate-950 min-h-[250px]"
            >
                {/* La librería inyectará acá adentro el visor de video de forma dinámica */}
            </div>
            </div>

            {/* Pie de interfaz explicativo */}
            <div className="p-4 text-center bg-slate-950 text-xs text-slate-400">
            Centrá el código QR de la chapita dentro del recuadro para procesarlo automáticamente.
            </div>

        </div>
        </div>
    )}
    </>
)
}