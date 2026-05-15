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
  pet_name: string;
  escaneado_en: string; // ISO String de la fecha
  direccion_aproximada?: string;
}
/**
 * Para el estado del Dashboard (Ajustado)
 */
//export interface Dashboa
// rdStats {
//  total_scans: number;
 // recent_scans: ScanWithLocation[]; // Ahora coinciden perfectamente
//}

export interface PaginatedScans {
  items: ScanWithLocation[];
  total: number;
  page: number;
  limit: number;
}