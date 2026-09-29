
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
  color?: string;           
  edad_aproximada?: string; 
  notas?: string;           
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

export interface VeterinarioStats {
  turnos_hoy: number
  turnos_proximos: number
  historias_clinicas: number
  mascotas_activas: number
  qrs_asignados: number
  documentos_cargados: number
}

export interface ConsultaPorDia {
  date: string
  count: number
}

export interface VeterinarioDashboardData {
  stats: VeterinarioStats
  consultas_por_dia: ConsultaPorDia[]
}

// 3. Dashboard Administrador
export interface AdminDashboardData {
  users_count: number
  pets_count: number
  qrs_count: number
  scans_count: number
  scans_by_day?: Array<{ date: string; count: number }>
}

// TIPO UNIÓN EXPORTADO (Resuelve 'Cannot find name DashboardDataUnion')
export type DashboardDataUnion = UserDashboardData | VeterinarioDashboardData | AdminDashboardData