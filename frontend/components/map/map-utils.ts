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

// Adaptador corregido
export function normalizeScans(rawScans: any[]): NormalizedScan[] {
  return rawScans
    .filter((s) => (s.latitud != null || s.lat != null) && (s.longitud != null || s.lng != null))
    .map((s, index) => ({
      id: String(s.id || `scan-${index}`),
      latitud: Number(s.latitud ?? s.lat),
      longitud: Number(s.longitud ?? s.lng), 
      mascotaNombre: s.mascota_nombre || s.pet_name || s.mascota_nombre || 'Mascota',
      ownerNombre: s.owner_name || s.dueno_nombre || undefined,
      fecha: s.fecha || s.created_at || s.escaneado_en || new Date().toISOString(), // 🎯 Agregado s.created_at por tu modelo de backend
      direccion: s.direccion_aproximada || s.direccion || undefined,
    }))
}