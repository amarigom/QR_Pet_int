'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function ScanMap({ scans }: { scans: any[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  // Generamos un ID único para este renderizado
  const [mapId] = useState(() => `map-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    // Si no hay contenedor o ya existe la instancia, no hacemos nada
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // 1. Inicialización
    const map = L.map(mapContainerRef.current).setView([-37.32, -59.13], 13)

    // 2. Capa de Mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    // 3. Marcadores (Simplificado para probar)
    if (scans && scans.length > 0) {
      scans.forEach(scan => {
        if (scan.latitud && scan.longitud) {
          L.marker([scan.latitud, scan.longitud])
            .addTo(map)
            .bindPopup(scan.mascota_nombre || "Mascota")
        }
      })
    }

    mapInstanceRef.current = map

    // 4. LIMPIEZA TOTAL (La clave del éxito)
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off() // Quita todos los eventos
        mapInstanceRef.current.remove() // Destruye el mapa
        mapInstanceRef.current = null // Limpia la referencia
      }
    }
  }, [scans])

  return (
    <div className="w-full h-full border-2 border-green-500 rounded-lg overflow-hidden">
      <div 
        id={mapId}
        ref={mapContainerRef} 
        style={{ height: '450px', width: '100%' }} 
      />
    </div>
  )
}