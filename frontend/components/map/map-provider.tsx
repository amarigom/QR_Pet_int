'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Cargamos el mapa dinámicamente desactivando el renderizado del lado del servidor (ssr: false)
const LazyMap = dynamic(() => import('./index'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] space-y-3">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  )
})

interface MapProviderProps {
  scans: any[]
  isAdmin?: boolean
}

export function ScanMapProvider({ scans, isAdmin }: MapProviderProps) {
  return (
    /*  MURO DE CONTENCIÓN DE QA:
       - relative: Crea un nuevo contexto de posición.
       - overflow-hidden: Recorta cualquier pedazo de mapa que intente salirse al moverlo.
       - z-0: Resetea la prioridad visual para que los menús (z-40 o z-50) pasen siempre por arriba.
       - w-full h-[450px]: Le da la dimensión exacta. */
    <div className="relative w-full h-[450px] overflow-hidden rounded-xl border bg-card z-0">
      <LazyMap scans={scans} isAdmin={isAdmin} />
    </div>
  )
}