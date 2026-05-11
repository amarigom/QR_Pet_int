import { fetchAPI } from './client';
import type { AdminQR, RecentScan } from '../types/admin';
import type { User, Pet, AdminStats, QRCode,PaginatedResponse, ScanWithLocation, ScanResponse } from '../types';
import { Scatter } from 'recharts';

export const adminApi = {
  getStats: () => fetchAPI<AdminStats>('/admin/stats'),
  

  getUsers: async (): Promise<User[]> => {
    const data = await fetchAPI<any>('/admin/users');
    // Escudo: si el backend devuelve un objeto con 'items', lo extraemos. 
    // Si no, verificamos si es un array.
    return Array.isArray(data) ? data : (data.items || []);
  },

  getPets: async (): Promise<(Pet & { owner_name: string })[]> => {
    const data = await fetchAPI<any>('/admin/pets');
    // Aquí usamos 'Pet', eliminando el error de "never read"
    return (Array.isArray(data) ? data : (data.items || [])) as (Pet & { owner_name: string })[];
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


  generateQRs: (cantidad: number) => fetchAPI<{ created: number; qrs: QRCode[] }>('/admin/qr/generate', {
    method: 'POST',
    body: JSON.stringify({ cantidad }),
  }),

  deleteQR: (qrId: string) => fetchAPI(`/admin/qr/${qrId}`, { 
    method: 'DELETE' 
  }),


getScans: async (page = 1, limit = 100) => {
  // Ajustado a la ruta que Swagger confirmó que funciona
  return fetchAPI<PaginatedResponse<any>>(`/scans?page=${page}&limit=${limit}`);
},


getAllScans: async (page = 1, limit = 100): Promise<ScanWithLocation[]> => {
    // Llamada al endpoint real que confirmaste
    const response = await fetchAPI<PaginatedResponse<any>>(`/scans?page=${page}&limit=${limit}`);
    
    const rawItems = response?.items || [];
    console.log(`Scans obtenidos del backend: ${rawItems.length}`);

    return rawItems.map((s: any): ScanWithLocation => ({
      id: s.id,
      // Usamos Number() por si vienen como string, y manejamos el null
      latitud: s.latitud !== null ? Number(s.latitud) : 0,
      
      longitud: s.longitud !== null ? Number(s.longitud) : 0,
      // Escudo para mascota null:
      pet_name: s.mascota?.nombre || `QR: ${s.qr_codigo}`,
      escaneado_en: s.escaneado_en || s.created_at || new Date().toISOString(),
      direccion_aproximada: s.direccion_aproximada || "Sin dirección registrada",
    }));
  },

}