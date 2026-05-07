import { fetchAPI } from './client';
import type { AdminQR } from '../types/admin';
import type { User, Pet, AdminStats, QRCode,PaginatedResponse } from '../types';

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
  return fetchAPI<PaginatedResponse<any>>(`/qr?page=${page}&limit=${limit}`);
}
};