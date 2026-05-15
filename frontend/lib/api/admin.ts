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

  // 1. Asegúrate de que el tipo sea consistente con tu interfaz Pet
getPets: async (): Promise<Pet[]> => {
    // 2. fetchAPI debe apuntar internamente al puerto 8000
    const data = await fetchAPI<any>('/admin/pets');

    // 3. Normalización limpia
    const rawItems = Array.isArray(data) ? data : (data.items || []);

    // 4. Mapeo (Si el backend manda 'owner', pero quieres asegurar compatibilidad)
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

 // 5. Gestión de una mascota específica
  
getPetById: async (id: string) => {
  const token = localStorage.getItem('token'); // O la fuente que uses para el JWT

const response = await fetch(`/admin/pets/${id}`, {
  headers: {
    'Authorization': `Bearer ${token}`, // ESTO ES LO QUE FALTA
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

