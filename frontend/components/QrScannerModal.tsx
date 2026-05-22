
"use client" // Clave: manejamos hardware (cámara) y ciclo de vida en el cliente

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { QrCode, X, Camera } from 'lucide-react'
import { toast } from 'sonner'

export default function QrScannerModal() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (!isOpen) return

        // Configuración del escáner estilo Mercado Pago: rápido y directo
    const scanner = new Html5QrcodeScanner(
        "reader-container", // ID del div del HTML donde se inyecta la cámara
        { 
            fps: 15,           // Cuadros por segundo para procesar la imagen
            qrbox: { width: 250, height: 250 }, // Caja de enfoque visual
            aspectRatio: 1.0   // Cuadrado perfecto para enfocar la chapita
        },
        /* verbose= */ false
        )

        // Qué hace la app cuando detecta el QR con éxito
        const onScanSuccess = (decodedText: string) => {
        try {
            // Detenemos la cámara de inmediato para liberar el hardware del celu
            scanner.clear()
            setIsOpen(false)
            
            toast.success("¡Código QR detectado con éxito!")

            // Analizamos lo que escaneó. El usuario puede apuntar a una URL completa de PetQR
            // o al ID limpio impreso. Manejamos ambas opciones de forma inteligente:
        if (decodedText.includes('/scan/')) {
            const parts = decodedText.split('/scan/')
            const qrId = parts[parts.length - 1]
            router.push(`/scan/${qrId}`)
            } else {
            // Si escaneó solo el texto/ID plano
            router.push(`/scan/${decodedText.trim()}`)
            }
        } catch (err) {
            console.error("Error al procesar el éxito del escaneo:", err)
        }
        }

        const onScanFailure = (error: any) => {
        // Dejamos que corra en silencio por detrás mientras busca el foco del código
        }

        // Inicializamos la cámara
        scanner.render(onScanSuccess, onScanFailure)

        // Limpieza automática si el usuario cierra el modal de golpe
        return () => {
        scanner.clear().catch((err) => console.log("Cámara cerrada automáticamente", err))
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
                    className="w-full rounded-xl overflow-hidden border border-slate-800 [&_video]:rounded-xl [&_a]:hidden [&_button]:bg-primary [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md [&_button]:text-sm [&_button]:font-medium [&_button]:my-2"
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