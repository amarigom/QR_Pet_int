
import { Pet } from './pets'; 
import { ScanWithLocation } from './scan';

export interface QRInfo {
  id: string;
  codigo: string;
  activo: boolean;
}

export interface PetData {
  id: string;
  nombre: string;
  especie: string;
  estado: string;
  foto_url?: string;
  raza?: string;
  color?: string;           // 🌟 Agregado correctamente
  edad_aproximada?: string; // 🌟 Agregado correctamente
  notas?: string;           // 🌟 Agregado correctamente
  qr?: {
    id: string;
    codigo: string;
    estado: string;
  } | null;
  qr_code?: any;
}

export interface RecentScanData {
  id: string;
  mascota_nombre: string;
  latitud?: number;
  longitud?: number;
  direccion_aproximada?: string;
  created_at: string;
  recent_scans?: any[]; 
  scans?: any[];
}

export interface DashboardSummary {
  total_pets: number;
  active_qrs: number;
}


export interface UserDashboardData {
  role: 'user';
  summary: DashboardSummary;
  pets: PetData[];
  recent_activity: ScanWithLocation[]; // Mapeado exacto para tus escaneos
}