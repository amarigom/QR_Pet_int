
export interface QRInfo {
  id: string;
  codigo: string;
  activo: boolean;
}

export interface PetData {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  estado: string;
  foto_url?: string;
  created_at: string;
  qr?: QRInfo | null; 
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