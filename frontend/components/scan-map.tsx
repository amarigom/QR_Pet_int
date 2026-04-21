'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
/*import 'leaflet/dist/leaflet.css'*/
import { formatDateTime } from '@/lib/utils'
import type { ScanWithLocation, Pet } from '@/lib/types'

// Fix Leaflet default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface ScanMapProps {
  scans: ScanWithLocation[]
  pets: Pet[]
}

function FitBounds({ scans }: { scans: ScanWithLocation[] }) {
  const map = useMap()

  useEffect(() => {
    if (scans.length > 0) {
      const bounds = L.latLngBounds(
        scans
          .filter((s) => s.latitud && s.longitud)
          .map((s) => [s.latitud!, s.longitud!] as [number, number])
      )
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [scans, map])

  return null
}

export default function ScanMap({ scans, pets }: ScanMapProps) {
  // Default center (Mexico City)
  const defaultCenter: [number, number] = [19.4326, -99.1332]
  
  const validScans = scans.filter((s) => s.latitud && s.longitud)
  const center = validScans.length > 0
    ? [validScans[0].latitud!, validScans[0].longitud!] as [number, number]
    : defaultCenter

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds scans={validScans} />
      {validScans.map((scan) => (
        <Marker
          key={scan.id}
          position={[scan.latitud!, scan.longitud!]}
        >
          <Popup>
            <div className="p-2 min-w-[150px]">
              <p className="font-semibold">{scan.pet_name || 'Mascota'}</p>
              <p className="text-sm text-gray-600">
                {formatDateTime(scan.escaneado_en)}
              </p>
              {scan.direccion_aproximada && (
                <p className="text-xs text-gray-500 mt-1">{scan.direccion_aproximada}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
