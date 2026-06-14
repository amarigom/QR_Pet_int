import { fetchAPI } from './client';
import type { Pet, PetFormData, PetDetailResponse } from '../types';
import { UserDashboardStats } from '../types/user';

export const petsApi = {

  getDashboardStats: () => fetchAPI<UserDashboardStats>('/pets/stats/summary'), 
  
  getAll: (page = 1, limit = 20) => 
    fetchAPI<{ items: Pet[]; total: number }>(`/pets?page=${page}&limit=${limit}`),
  
  // api/pets.ts
  getById: (id: string) => fetchAPI<Pet>(`/pets/${id}`),
  
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
