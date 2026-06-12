'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { NormalizedScan } from './map-utils'

interface FitBoundsProps {
  scans: NormalizedScan[]
}

export function FitBounds({ scans }: FitBoundsProps) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // RECALCULO DE QA: Forzamos a Leaflet a tomar las dimensiones reales del contenedor
    // Un pequeño delay de 200ms asegura que Next.js ya terminó de estirar el div en la pantalla
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    // Si no hay escaneos, solo recalculamos el tamaño y no movemos la cámara
    if (scans.length === 0) {
      return () => clearTimeout(timer)
    }

    // Centramos el mapa en base a los pines de escaneo de Neon
    const points = scans.map((s) => [s.latitud, s.longitud] as [number, number])
    const bounds = L.latLngBounds(points)
    
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })

    return () => clearTimeout(timer)
  }, [scans, map])

  return null
}