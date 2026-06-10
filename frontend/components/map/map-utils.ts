import L from 'leaflet'

// Solución definitiva al bug de iconos en Next.js / Leaflet
export function setupLeafletIcons() {
  if (typeof window === 'undefined') return
  
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
  
  L.Marker.prototype.options.icon = DefaultIcon
}

// Interfaz limpia y normalizada que usará nuestro mapa internamente
export interface NormalizedScan {
  id: string
  latitud: number
  longitud: number
  mascotaNombre: string
  ownerNombre?: string
  fecha: string
  direccion?: string
}

// Adaptador: Transforma cualquier formato que venga de la API al formato del mapa
export function normalizeScans(rawScans: any[]): NormalizedScan[] {
  return rawScans
    .filter((s) => (s.latitud || s.lat) && (s.longitud || s.lng))
    .map((s, index) => ({
      id: s.id || `scan-${index}`,
      latitud: Number(s.latitud || s.lat),
      longitud: Number(s.longitud || s.longitud),
      mascotaNombre: s.mascota_nombre || s.pet_name || 'Mascota',
      ownerNombre: s.owner_name || s.dueno_nombre || undefined,
      fecha: s.fecha || s.escaneado_en || new Date().toISOString(),
      direccion: s.direccion_aproximada || s.direccion || undefined,
    }))
}