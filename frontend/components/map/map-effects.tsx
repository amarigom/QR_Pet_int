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
    if (scans.length === 0) return

    const points = scans.map((s) => [s.latitud, s.longitud] as [number, number])
    const bounds = L.latLngBounds(points)
    
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
  }, [scans, map])

  return null
}