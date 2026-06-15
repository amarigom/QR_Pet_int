
export interface QRInfo {
  id: string;
  codigo: string;
  activo: boolean;
}

export interface PetData {
  id: string
  nombre: string
  especie: string
  estado: string
  foto_url?: string
  raza?: string
  color?: string           // 🌟 AGREGAR
  edad_aproximada?: string // 🌟 AGREGAR
  notas?: string           // 🌟 AGREGAR
  qr?: {
    id: string
    codigo: string
    estado: string
  } | null
}
export interface RecentScanData {
  id: string;
  mascota_nombre: string;
  latitud?: number;
  longitud?: number;
  direccion_aproximada?: string;
  created_at: string;
}

//lo que la API le va a inyectar al UserDashboard
export interface UserDashboardData {
  role: 'user';
  summary: {
    total_pets: number;
    active_qrs: number;
  };
  pets: PetData[];
  recent_activity: RecentScanData[];
}

import { Pet } from './pets'; 

export interface DashboardSummary {
  total_pets: number;
  active_qrs: number;
}

export interface UserDashboardData {
  summary: DashboardSummary;
  pets: PetData[];
}