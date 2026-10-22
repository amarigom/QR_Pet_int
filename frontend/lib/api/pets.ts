import { fetchAPI } from './client';
import type {
  Pet,
  PetFormData,
  PetDetailResponse,
  PaginatedResponse,
  PetVeterinarianLink,
  VeterinarianClinicSearchResult,
} from '../types';
import { UserDashboardStats } from '../types/user';

export const petsApi = {

  getDashboardStats: () => fetchAPI<UserDashboardStats>('/pets/stats/summary'), 
  
  getAll: (page = 1, limit = 20, search = '') => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (search.trim()) params.set('search', search.trim())
    return fetchAPI<PaginatedResponse<Pet>>(`/pets?${params.toString()}`)
  },
  
  // api/pets.ts
  getById: (id: string) => fetchAPI<Pet>(`/pets/${id}`),

  searchVeterinarians: (query: string) =>
    fetchAPI<VeterinarianClinicSearchResult[]>(
      `/pets/veterinarias/buscar?q=${encodeURIComponent(query)}`,
    ),

  getVeterinarians: (petId: string) =>
    fetchAPI<PetVeterinarianLink[]>(`/pets/${petId}/veterinarias`),

  linkVeterinarian: (petId: string, veterinarianId: string) =>
    fetchAPI<PetVeterinarianLink[]>(`/pets/${petId}/veterinarias`, {
      method: 'POST',
      body: JSON.stringify({ veterinario_id: veterinarianId }),
    }),

  unlinkVeterinarian: (petId: string, veterinarianId: string) =>
    fetchAPI<{ message: string }>(
      `/pets/${petId}/veterinarias/${veterinarianId}`,
      { method: 'DELETE' },
    ),
  
  create: (data: PetFormData) => fetchAPI<Pet>('/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Partial<PetFormData>) => fetchAPI<Pet>(`/pets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => fetchAPI(`/pets/${id}`, { method: 'DELETE' }),
};
