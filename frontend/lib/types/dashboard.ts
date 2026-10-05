
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
  qr_code?: {
    id: string;
    codigo: string;
    estado?: string;
    activo?: boolean;
  } | null;
}

export interface RecentScanData {
  id: string;
  mascota_nombre: string;
  latitud?: number;
  longitud?: number;
  direccion_aproximada?: string;
  created_at: string;
  recent_scans?: ScanWithLocation[];
  scans?: ScanWithLocation[];
}

export interface DashboardSummary {
  total_pets: number;
  active_qrs: number;
}

export interface AdminDashboardData {
  users_count: number;
  pets_count: number;
  qrs_count: number;
  scans_count: number;
  scans_by_day: Array<{ date: string; count: number }>;
}

export interface UserDashboardData {
  role: 'user';
  summary: DashboardSummary;
  pets: PetData[];
  recent_activity: ScanWithLocation[];
  veterinary_brands: Array<{
    nombre_clinica: string
    logo_url: string | null
  }>
}