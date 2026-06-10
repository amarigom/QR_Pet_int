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
  return <LazyMap scans={scans} isAdmin={isAdmin} />
}