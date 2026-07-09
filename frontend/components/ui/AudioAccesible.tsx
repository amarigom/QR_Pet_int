'use client'

import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioAccesibleProps {
  texto: string; // El texto armado con los datos de la mascota
}

export default function AudioAccesible({ texto }: AudioAccesibleProps) {
  const [hablando, setHablando] = useState(false)
  const [sintetizador, setSintetizador] = useState<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Inicializamos el sintetizador solo en el cliente (Next.js Fix)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSintetizador(window.speechSynthesis)
    }
    
    // Limpieza obligatoria: si el usuario se va de la página, el audio se corta
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const manejarAudio = () => {
    if (!sintetizador) return

    if (hablando) {
      // Si ya está hablando, lo frenamos
      sintetizador.cancel()
      setHablando(false)
    } else {
      // Cancelamos cualquier audio residual previo
      sintetizador.cancel()

      // Creamos el enunciado con el texto que nos pasaron
      const enunciado = new SpeechSynthesisUtterance(texto)
      
      // Configuración de idioma y tono regional
      enunciado.lang = 'es-AR' // Intenta usar acento de Argentina si está disponible
      enunciado.rate = 0.95    // Un pelín más pausado para que sea bien legible y claro

      // Control de estados de los íconos
      enunciado.onend = () => setHablando(false)
      enunciado.onerror = () => setHablando(false)

      utteranceRef.current = enunciado
      setHablando(true)
      
      // ¡A hablar!
      sintetizador.speak(enunciado)
    }
  }

  return (
    <Button 
      onClick={manejarAudio} 
      variant={hablando ? "destructive" : "outline"}
      className="flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all shadow-sm"
      size="sm"
    >
      {hablando ? (
        <>
          <VolumeX className="w-4 h-4 animate-bounce" />
          <span>Detener Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-primary" />
          <span>Escuchar Datos</span>
        </>
      )}
    </Button>
  )
}