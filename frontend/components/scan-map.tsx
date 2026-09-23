'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RecentScan, Pet } from '@/lib/types'


// Corregir el problema de los iconos perdidos en Leaflet + Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// ------------------------
// 1. Definimos la interfaz fuera para que sea más legible
interface ScanMapProps {
  scans: RecentScan[];
  pets?: Pet[];            // Nuevo prop opcional
  initialCenter?: {        // Nuevo prop opcional
    lat: number;
    lng: number;
  };
}



export default function ScanMap({ scans, pets, initialCenter }: ScanMapProps ) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  // Generamos un ID único para este renderizado
  const [mapId] = useState(() => `map-${Math.random().toString(36).substr(2, 9)}`)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
  // 1. INICIALIZACIÓN (Solo si no existe)
  if (!mapContainerRef.current) return;

  if (!mapInstanceRef.current) {
    const map = L.map(mapContainerRef.current).setView([-37.32, -59.13], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);
    mapInstanceRef.current = map;
    console.log("Mapa inicializado por primera vez");
  }

  const map = mapInstanceRef.current;

  // 2. Actualizar marcadores sin duplicarlos en cada renderizado.
  if (markersLayerRef.current) {
    markersLayerRef.current.clearLayers()
  } else {
    markersLayerRef.current = L.layerGroup().addTo(map)
  }

  const validScans = scans.filter(
    (scan) =>
      Number.isFinite(scan.latitud) &&
      Number.isFinite(scan.longitud) &&
      scan.latitud !== null &&
      scan.longitud !== null
  )

  validScans.forEach(scan => {
      L.marker([scan.latitud!, scan.longitud!])
        .addTo(markersLayerRef.current!)
        .bindPopup(scan.mascota_nombre || "Mascota");
  })

  if (validScans.length > 0) {
    map.fitBounds(
      L.latLngBounds(validScans.map((scan) => [scan.latitud!, scan.longitud!])),
      { padding: [24, 24], maxZoom: 15 }
    )
  } else if (initialCenter) {
    map.setView([initialCenter.lat, initialCenter.lng], 13)
  }
    // 3. LIMPIEZA (Solo cuando el componente se destruye de verdad)
  
  }, [scans, initialCenter]);

  return (
    <div className="w-full h-full border-2 border-green-500 rounded-lg overflow-hidden">
      <div 
        id={mapId}
        ref={mapContainerRef} 
        style={{ height: '100%', minHeight: '300px', width: '100%' }} 
      />
    </div>
  )
}