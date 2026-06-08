import { Pet } from './pets';

export interface QRCode {
  id: string;
  codigo: string;
  mascota_id: string | null;
  activo: boolean;
  created_at: string;
}

export interface Scan {
  id: string;
  mascota_nombre: string;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
  mensaje_encontrador?: string; 
  telefono_encontrador?: string;
  direccion_aproximada: string;
}

export interface PetDetailResponse {
  pet: Pet;
  qr: QRCode | null;
  scans: Scan[];
}


