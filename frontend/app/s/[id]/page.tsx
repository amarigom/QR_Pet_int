'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Compatibilidad con códigos QR antiguos.
 * Todo el procesamiento público vive en /scan/[code], que crea el escaneo
 * antes de solicitar y persistir la ubicación del visitante.
 */
export default function LegacyPublicScanPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    if (id) {
      router.replace(`/scan/${encodeURIComponent(id)}`)
    }
  }, [id, router])

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <p className="text-sm text-muted-foreground">Cargando escaneo...</p>
    </main>
  )
}
