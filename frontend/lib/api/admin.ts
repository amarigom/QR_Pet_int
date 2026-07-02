import { fetchAPI } from './client';
import type { AdminQR, RecentScan } from '../types/admin';
import type { User, Pet, AdminStats, QRCode, PaginatedResponse, ScanWithLocation, ScanResponse } from '../types';

export const adminApi = {
  getStats: () => fetchAPI<AdminStats>('/admin/stats'),

  async toggleQRStatus(codigo: string) {
    return await fetchAPI(`/admin/qrs/${codigo}/status`, {
      method: 'PATCH',
    });
  },

  getUsers: async (): Promise<User[]> => {
    const data = await fetchAPI<any>('/admin/users');
    // Escudo: si el backend devuelve un objeto con 'items', lo extraemos. 
    // Si no, verificamos si es un array.
    return Array.isArray(data) ? data : (data.items || []);
  },

  // Asegúrate de que el tipo sea consistente con tu interfaz Pet
  getPets: async (): Promise<Pet[]> => {
    // fetchAPI debe apuntar internamente al puerto 8000
    const data = await fetchAPI<any>('/admin/pets');

    // Normalización limpia
    const rawItems = Array.isArray(data) ? data : (data.items || []);

    // Mapeo (Si el backend manda 'owner', pero quieres asegurar compatibilidad)
    return rawItems.map((item: any) => ({
      ...item,
      // Si el backend manda 'owner', lo usamos. Si no, mantenemos consistencia.
      owner: item.owner || item.datos_dueño || null 
    })) as Pet[];
  },

  deleteUser: (userId: string) => fetchAPI(`/admin/users/${userId}`, { 
    method: 'DELETE' 
  }),

  toggleAdmin: (userId: string) => fetchAPI<User>(`/admin/users/${userId}/toggle-admin`, { 
    method: 'POST' 
  }),

  getQRs: async (): Promise<AdminQR[]> => {
    const response = await fetchAPI<PaginatedResponse<AdminQR>>('/qr');
    
    // Si por alguna razón el backend fallara y no enviara items, 
    // devolvemos un array vacío para que el .map() no rompa la UI
    return response?.items || [];
  },

  generateQRs: (cantidad: number, lote: string) => 
    fetchAPI<{ created: number; qrs: AdminQR[] }>(
      `/admin/qr/generate?cantidad=${cantidad}&lote=${encodeURIComponent(lote.trim())}`, 
      {
        method: 'POST',
      }
    ),

  deleteQR: (qrId: string) => fetchAPI(`/admin/qr/${qrId}`, { 
    method: 'DELETE' 
  }),

  getScans: async (page = 1, limit = 100) => {
    // Ajustado a la ruta que Swagger confirmó que funciona
    return fetchAPI<PaginatedResponse<any>>(`/scans?page=${page}&limit=${limit}`);
  },

  // Gestión de una mascota específica
  getPetById: async (id: string) => {
    const token = localStorage.getItem('token'); // O la fuente que uses para el JWT

    const response = await fetch(`/admin/pets/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.json();
  },

  getAllScans: async (page = 1, limit = 100): Promise<ScanWithLocation[]> => {
    // Llamada al endpoint real que confirmaste
    const response = await fetchAPI<PaginatedResponse<any>>(`/scans?page=${page}&limit=${limit}`);
    
    const rawItems = response?.items || [];
    console.log(`Scans obtenidos del backend: ${rawItems.length}`);

    return rawItems.map((s: any): ScanWithLocation => {
      // Conservamos el null real para saber si el usuario compartió o no el GPS
      const lat = s.latitud !== null && s.latitud !== undefined ? Number(s.latitud) : null;
      const lng = s.longitud !== null && s.longitud !== undefined ? Number(s.longitud) : null;

      return {
        id: s.id,
        latitud: lat,
        longitud: lng,
        
        // Sincronizado: el backend ya manda 'pet_name' y 'qr_codigo' directos
        pet_name: s.pet_name || "Mascota sin asignar",
        qr_codigo: s.qr_codigo || "N/A",
        
        // Sincronizado con los nombres de tu backend antiguo y nuevo para que nunca falle
        escaneado_en: s.escaneado_en || s.fecha || s.created_at || new Date().toISOString(),
        
        // Si el backend manda un texto real lo usa, sino se evalúa el componente inverso
        direccion_aproximada: s.direccion_aproximada || ""
      };
    });
  },




  
  // Descarga segura del lote de impresión en formato PDF binario (Blob)
  async downloadLotePdf(lote: string): Promise<Blob> {
    const token = localStorage.getItem('token');
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Limpiamos la URL para evitar que se duplique el segmento /api/v1
    const base = BACKEND_URL.endsWith('/api/v1') ? BACKEND_URL : `${BACKEND_URL}/api/v1`;
    
    const response = await fetch(`${base}/qr/download-pdf?lote=${encodeURIComponent(lote.trim())}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error('Error al descargar el archivo PDF de la plantilla');
    }

    // Retorna el archivo crudo como un flujo binario directo de FastAPI
    return await response.blob();
  },
}