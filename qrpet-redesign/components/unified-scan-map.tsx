'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css' // ¡Crucial que esté activo!
import { formatDateTime } from '@/lib/utils'

// 1. Configuración de Iconos (Igual para todos)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface UnifiedScanMapProps {
  scans: any[]
  isAdmin?: boolean // Flag para decidir qué info mostrar en el Popup
}

function FitBounds({ scans }: { scans: any[] }) {
  const map = useMap()
  useEffect(() => {
    const validPoints = scans
      .filter((s) => s.latitud && s.longitud)
      .map((s) => [s.latitud, s.longitud] as [number, number])

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [scans, map])
  return null
}

export default function UnifiedScanMap({ scans, isAdmin = false }: UnifiedScanMapProps) {
  // Centro inicial en Tandil
  const defaultCenter: [number, number] = [-37.3217, -59.1332]
  const validScans = scans.filter((s) => s.latitud && s.longitud)

  return (
    <div className="w-full h-full min-h-[400px] border rounded-md overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={isAdmin ? 5 : 13} // Admin ve más lejos, Usuario ve su ciudad
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds scans={validScans} />

        {validScans.map((scan) => (
          <Marker key={scan.id} position={[scan.latitud!, scan.longitud!]}>
            <Popup>
              <div className="p-1 text-sm">
                {/* Nombre de mascota (soporta ambos esquemas de datos) */}
                <p className="font-bold text-blue-600">
                  {scan.mascota_nombre || scan.pet_name || 'Mascota'}
                </p>
                
                {/* Info extra SOLO para el Admin */}
                {isAdmin && (
                  <p className="text-xs font-medium">
                    Dueño: <span className="text-gray-600">{scan.owner_name || 'N/A'}</span>
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  {formatDateTime(scan.fecha || scan.escaneado_en)}
                </p>

                {scan.direccion_aproximada && (
                  <p className="text-[10px] text-gray-400 mt-1 italic border-top pt-1">
                    {scan.direccion_aproximada}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}