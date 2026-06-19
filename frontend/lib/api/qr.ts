import { fetchAPI } from './client';
import type { QRCode, Pet } from '../types';

export interface QRCheckResult {
  available: boolean;
  message: string;
  has_pet?: boolean;
}

export interface QRActivateData {
  codigo: string;
  nombre: string;
  especie: string;
  raza?: string | null;
  color?: string | null;
  edad_aproximada?: string | null;
  foto_url?: string | null;
  notas?: string | null;
}

export const qrApi = {
  // Generar un código para una mascota existente
  generate: (petId: string) => 
    fetchAPI<QRCode>(`/qr/generate/${petId}`, { method: 'POST' }),

  // Desactivar un QR
  deactivate: (qrId: string) => 
    fetchAPI(`/qr/${qrId}/deactivate`, { method: 'POST' }),

  /**
   * PÚBLICO: Registra el inicio del escaneo y obtiene datos de la mascota.
   * Ahora devuelve el scan_id necesario para actualizaciones.
   */
  scan: (code: string) => {
    return fetchAPI<{ 
      pet: Pet; 
      owner: { nombre: string; telefono: string }; 
      scan_id: string 
    }>(`/scans/process/${code}`, { method: 'POST' });
  },

  /**
   * PÚBLICO: Actualiza la ubicación del escaneo de forma silenciosa.
   */
  updateScanLocation: (scanId: string, location: { lat: number; lng: number }) => {
    return fetchAPI(`/scans/${scanId}/location`, {
      method: 'PUT',
      body: JSON.stringify({
        latitud: location.lat,
        longitud: location.lng,
        direccion: "Ubicación aproximada"
      }),
    });
  },

  /**
   * PÚBLICO: Envía el mensaje manual del transeúnte.
   */
  updateScanMessage: (scanId: string, message: string) => {
    return fetchAPI(`/scans/${scanId}/message`, {
      method: 'PUT',
      body: JSON.stringify({
        mensaje_encontrador: message
      }),
    });
  },

  // Verificar si un código QR físico es válido
  check: (code: string) => 
    fetchAPI<QRCheckResult>(`/qr/check/${code}`),

  // Activar un QR y crear la mascota
  activate: (data: QRActivateData) => 
    fetchAPI<{ pet: Pet; qr: QRCode }>('/qr/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};