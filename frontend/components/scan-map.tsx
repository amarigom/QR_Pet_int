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

  // 2. ACTUALIZACIÓN DE MARCADORES (Se ejecuta siempre que cambie 'scans')
  // Primero limpiamos marcadores viejos si fuera necesario (opcional)
  
  if (scans && scans.length > 0) {
    console.log(`Procesando ${scans.length} escaneos...`);
    scans.forEach(scan => {
      if (scan.latitud && scan.longitud) {
        console.log(`Marcador agregado: ${scan.mascota_nombre}`);
        L.marker([scan.latitud, scan.longitud])
          .addTo(map)
          .bindPopup(scan.mascota_nombre || "Mascota");
      }
    });
  } else {
    console.log('No hay escaneos para mostrar.');

  }
    // 3. LIMPIEZA (Solo cuando el componente se destruye de verdad)
  
}, [scans, initialCenter]);

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