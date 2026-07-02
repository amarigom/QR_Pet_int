import { fetchAPI } from './client'; // O como tengas configurado tu cliente base
import { ScanResponse, PaginatedScans } from '@/lib/types';

export const scansApi = {
  // --- RUTAS DE USUARIO ---
  /**
   * Obtiene SOLO los escaneos de las mascotas del usuario logueado
   */
  getMe: async (): Promise<ScanResponse[]> => {
    // Esta ruta debe existir en tu backend (ej: @router.get("/me"))
    return fetchAPI<ScanResponse[]>('/scans/me');
  },
  /**
   * Obtiene la lista paginada de escaneos para el panel de administración
   */
  getAll: async (page = 1, limit = 100): Promise<PaginatedScans> => {
    return fetchAPI<PaginatedScans>(`/qr?page=${page}&limit=${limit}`);
  },

  /**
   * Obtiene los escaneos específicos de una mascota (si lo necesitaras después)
   */
  getByPet: async (petId: string): Promise<ScanResponse[]> => {
    return fetchAPI<ScanResponse[]>(`/qr/pet/${petId}`);
  },

  /**
   * Obtiene estadísticas rápidas de escaneos
   */
  getStats: async () => {
    return fetchAPI<{ total: number; last_24h: number }>('/qr/stats');
  },

  getUserScans: async (): Promise<PaginatedScans> => {
      return await fetchAPI<PaginatedScans>('/scans/user/latest');
    }
};