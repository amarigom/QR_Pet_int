import { fetchAPI } from './client';
import type { UserDashboardStats } from '../types/user';
import type { 
    User, 
    Pet, 
    Scan, 
    PaginatedResponse 
} from '../types';

export const userApi = {
    // 1. Estadísticas exclusivas del usuario logueado
    getDashboardStats: () => fetchAPI<UserDashboardStats>('/pets/my-stats'),

    // 2. Obtener solo MIS mascotas
    getMyPets: async (): Promise<Pet[]> => {
        const data = await fetchAPI<any>('/pets/me');
        // Manejamos si el backend devuelve array directo o paginado
        return Array.isArray(data) ? data : (data.items || []);
    },

    // 3. Obtener solo MIS escaneos recientes
    getMyScans: async (): Promise<Scan[]> => {
        const data = await fetchAPI<any>('/scans/me');
        return Array.isArray(data) ? data : (data.items || []);
    },

    // 4. Ubicaciones para el mapa (la que configuramos en maps.py)
    getMapLocations: () => fetchAPI<any[]>('/maps/locations'),

    // 5. Gestión de una mascota específica
    getPetDetails: (petId: string) => fetchAPI<Pet>(`/pets/${petId}`),
    
    updatePet: (petId: string, data: Partial<Pet>) => fetchAPI<Pet>(`/pets/${petId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    deletePet: (petId: string) => fetchAPI(`/pets/${petId}`, {
        method: 'DELETE'
    }),
};