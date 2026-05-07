// lib/types/scan.ts

import { Pet } from './pets';

/**
 * Representa el escaneo tal cual viene del Backend (FastAPI)
 * Mantenemos este para la tabla general si ya la usás
 */
export interface ScanResponse {
  id: string | number;
  qr_codigo: string;
  fecha: string;
  ubicacion: string;
  coordenadas: string; 
  mascota: Pet | string;
}

/**
 * ESTA ES LA INTERFAZ CLAVE PARA EL MAPA Y DASHBOARD
 * Sincronizada con el esquema Pydantic "ScanLocation" de FastAPI
 */
export interface ScanWithLocation {
  id: string | number;
  latitud: number;
  longitud: number;
  mascota_nombre: string; // Antes tenías pet_name
  fecha?: string;          // Antes tenías escaneado_en
  direccion?: string;     // Opcional por si viene direccion_aproximada
  owner_name?: string;
  
}

/**
 * Para el estado del Dashboard (Ajustado)
 */
export interface DashboardStats {
  total_scans: number;
  recent_scans: ScanWithLocation[]; // Ahora coinciden perfectamente
}

export interface PaginatedScans {
  items: ScanWithLocation[];
  total: number;
  page: number;
  limit: number;
}