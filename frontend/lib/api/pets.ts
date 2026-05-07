import { fetchAPI } from './client';
import type { Pet, PetFormData, PetDetailResponse } from '../types';
import { UserDashboardStats } from '../types/user';

export const petsApi = {

  getDashboardStats: () => fetchAPI<UserDashboardStats>('/pets/stats/summary'), 
  
  getAll: () => fetchAPI<Pet[]>('/pets'),
  
  getById: (id: string) => fetchAPI<PetDetailResponse>(`/pets/${id}`),
  
  create: (data: PetFormData) => fetchAPI<Pet>('/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Partial<PetFormData>) => fetchAPI<Pet>(`/pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => fetchAPI(`/pets/${id}`, { method: 'DELETE' }),
};
