'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { formatDateTime } from '@/lib/utils'
import { setupLeafletIcons, normalizeScans } from './map-utils'


// Inicializamos la configuración de iconos de Leaflet (evita marcadores invisibles)
setupLeafletIcons()

interface UnifiedScanMapProps {
  scans: any[]
  isAdmin?: boolean
}

export default function UnifiedScanMap({ scans, isAdmin = false }: UnifiedScanMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  
  // ID único original para asegurar el aislamiento de la instancia en el DOM
  const [mapId] = useState(() => `map-${Math.random().toString(36).substring(2, 9)}`)
  const defaultCenter: [number, number] = [-37.3217, -59.1332] // Tandil

  // 1. EFECTO DE INICIALIZACIÓN DE MAPA (Se ejecuta una única vez)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current).setView(defaultCenter, isAdmin ? 5 : 13)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    
    // Inicializamos el grupo aislado exclusivamente para los marcadores
    const markersLayer = L.layerGroup().addTo(map)
    
    mapInstanceRef.current = map
    markersLayerRef.current = markersLayer
    console.log("Mapa inicializado por primera vez de forma nativa");

    // Limpieza física total al desmontar para evitar fugas de memoria
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersLayerRef.current = null
        console.log("Instancia de mapa destruida correctamente en el desmontaje");
      }
    }
  }, [isAdmin])

  // 2. EFECTO DE ACTUALIZACIÓN DE MARCADORES (Con candado de control estricto de QA)
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersLayer = markersLayerRef.current

    if (!map || !markersLayer) return

    // 🎯 CANDADO DE CONTROL: Si scans viene roto, nulo, o indefinido por el body vacío, frena acá
    if (!scans || !Array.isArray(scans) || scans.length === 0) {
      console.warn("Map ignoró la actualización: 'scans' no es un array válido o vino vacío.");
      markersLayer.clearLayers()
      return
    }

    // Normalizamos el array habiendo pasado el control de sanidad
    const normalizedScans = normalizeScans(scans)
    
    // Limpiamos la capa por completo antes de volver a iterar
    markersLayer.clearLayers()

    console.log(`Procesando de forma segura ${normalizedScans.length} escaneos reales...`);
    const points: [number, number][] = []
    const coordenadasUsadas = new Set<string>()

    normalizedScans.forEach(scan => {
      // Control inteligente de tipos para evitar errores de compilación en TS
      let lat = typeof scan.latitud === 'number' ? scan.latitud : parseFloat(scan.latitud || '0')
      let lng = typeof scan.longitud === 'number' ? scan.longitud : parseFloat(scan.longitud || '0')

      // Filtro defensivo para omitir coordenadas vacías o inválidas
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`

        // 🎯 EFECTO JITTER: Si la coordenada se repite, le aplicamos dispersión 
        // para que se separen físicamente y puedas verlos de forma individual.
        if (coordenadasUsadas.has(coordKey)) {
          lat += (Math.random() - 0.5) * 0.0004
          lng += (Math.random() - 0.5) * 0.0004
        } else {
          coordenadasUsadas.add(coordKey)
        }

        points.push([lat, lng])
        console.log(`Marcador agregado con éxito: ${scan.mascotaNombre || 'QR Mascota'}`);

        const popupHtml = `
          <div class="p-1 font-sans text-sm min-w-[150px]">
            <p class="font-bold text-blue-600 m-0">${scan.mascotaNombre || 'Mascota sin Nombre'}</p>
            ${isAdmin && scan.ownerNombre ? `<p class="text-xs font-medium text-gray-600 my-0.5">Dueño: <span class="text-gray-900">${scan.ownerNombre}</span></p>` : ''}
            <p class="text-xs text-gray-500 m-0">${formatDateTime(scan.fecha)}</p>
            ${scan.direccion ? `<p class="text-[10px] text-gray-400 mt-1 italic border-t pt-1 m-0 max-w-[180px] truncate">${scan.direccion}</p>` : ''}
          </div>
        `

        L.marker([lat, lng])
          .addTo(markersLayer)
          .bindPopup(popupHtml)
      }
    })

    // Auto-ajuste de zoom dinámico según los marcadores válidos cargados
    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    }

  // 🎯 Serializamos el array en la dependencia para que React compare el CONTENIDO 
  // real de los datos en vez de las referencias de memoria, matando el bucle infinito.
  }, [JSON.stringify(scans), isAdmin])

  return (
    <div className="w-full h-full min-h-[450px] border rounded-lg overflow-hidden shadow-sm bg-muted/20">
      <div
        id={mapId}
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: '450px', width: '100%' }}
      />
    </div>
  )
}