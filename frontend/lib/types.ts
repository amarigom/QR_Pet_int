export interface User {
  id: string
  email: string
  nombre: string
  telefono: string | null
  rol: string
  avatar_url: string | null
  created_at: string
}

export interface Pet {
  id: string
  nombre: string
  especie: string
  raza: string | null
  color: string | null
  edad_aproximada: string | null
  foto_url: string | null
  notas: string | null
  estado: string
  usuario_id: string
  created_at: string
}

export interface QRCode {
  id: string
  codigo: string
  mascota_id: string | null
  activo: boolean
  created_at: string
}

export interface Scan {
  id: string;
  mascota_nombre: string;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
  // AGREGÁ EL SIGNO '?' AQUÍ:
  mensaje_encontrador?: string; 
  telefono_encontrador?: string;
  direccion_aproximada: string;
}

// Respuesta del endpoint GET /pets/{id}
export interface PetDetailResponse {
  pet: Pet
  qr: QRCode | null
  scans: Scan[]
}

export interface ScanWithLocation extends Scan {
  pet_name: string;      // Campos extra que requiere el componente mapa
  escaneado_en: string;
}

export interface DashboardStats {
  pets_count: number
  qrs_count: number
  scans_count: number
  recent_scans: {
    id: string
    mascota_nombre: string
    latitud: number | null
    longitud: number | null
    created_at: string
    direccion_aproximada: string;
    escaneado_en: string;
  }[]
}

export interface AdminStats {
  users_count: number
  pets_count: number
  qrs_count: number
  scans_count: number
  scans_by_day: { date: string; count: number }[]
  recent_scans: ScanWithLocation[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  nombre: string
  telefono?: string
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

export interface ApiError {
  detail: string
}

export type PetFormData = {
  nombre: string
  especie: string
  raza?: string | null
  color?: string | null
  edad_aproximada?: string | null
  foto_url?: string | null
  notas?: string | null
}
