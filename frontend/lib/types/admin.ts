import { ScanWithLocation } from './scan';



export interface RecentScan {
  id: string;
  mascota_nombre: string;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
  direccion_aproximada?: string; // Opcional por si el backend no la manda
  escaneado_en?: string;  
  fecha?:   string;
  qr_codigo: string;
}
export interface DashboardStats {
  pets_count?: number;
  qrs_count?: number;
  scans_count?: number;
  recent_scans: RecentScan[];
  total_scans: number;
}

export interface AdminStats {
  users_count: number;
  pets_count: number;
  qrs_count: number;
  total_scans: number;
  scans_by_day: { date: string; count: number }[];
  recent_scans: ScanWithLocation[];
}

export interface AdminQR {
  id: string;
  codigo: string;
  activo: boolean; // Mantenemos el booleano del sistema por compatibilidad con el switch
  created_at: string;
  lote?: string | null;
  mascota_id: string | null;
  mascota: {
    id: string;
    nombre: string;
    estado?: 'activo' | 'en_casa' | 'perdido'; // 🎯 ¡ACÁ VA! El estado le pertenece a la mascota
    owner: {
      nombre: string;
      email: string;
    } | null;
  } | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}