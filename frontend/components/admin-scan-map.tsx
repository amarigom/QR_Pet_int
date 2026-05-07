'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css' 
import { formatDateTime } from '@/lib/utils'

interface ScanLocation {
  id: string | number
  latitud: number
  longitud: number
  mascota_nombre: string
  fecha: string | Date
}

interface AdminScanMapProps {
  scans: ScanLocation[]
  pets?: any[] 
}

// Fix de iconos
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

function FitBounds({ scans }: { scans: ScanLocation[] }) {
  const map = useMap()
  useEffect(() => {
    if (scans.length > 0) {
      const coords = scans.map(s => [s.latitud, s.longitud] as [number, number]);
      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [scans, map])
  return null
}

export default function AdminScanMap({ scans }: AdminScanMapProps) {
  const TANDIL_CENTER: [number, number] = [-37.32167, -59.13316]
  
  // Referencia al contenedor del mapa
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const validScans = useMemo(() => 
    (scans || []).filter((s) => 
      s.latitud !== null && s.longitud !== null && 
      !isNaN(Number(s.latitud)) && !isNaN(Number(s.longitud))
    ), 
    [scans]
  )

  return (
    <div className="w-full h-full min-h-[450px] relative">
      {/* 
        PASO CLAVE: Usamos un div intermedio. 
        React-Leaflet a veces falla al limpiar su propio contenedor.
      */}
      <div 
        ref={mapContainerRef} 
        style={{ height: '450px', width: '100%' }}
        className="rounded-xl overflow-hidden border border-slate-200 shadow-md"
      >
        <MapContainer
          // Usamos una key que cambie siempre en desarrollo si hay problemas
          key={typeof window !== 'undefined' ? `map-${validScans.length}` : 'map-ssr'}
          center={TANDIL_CENTER}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds scans={validScans} />

          {validScans.map((scan) => (
            <Marker 
              key={scan.id} 
              position={[Number(scan.latitud), Number(scan.longitud)]}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{scan.mascota_nombre}</p> 
                  <p>{formatDateTime(scan.fecha.toString())}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}