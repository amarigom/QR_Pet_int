import { PetData, UserDashboardData } from '@/lib/types/dashboard';
import { fetchAPI } from './client';
import { DashboardStats } from '../types';

export const dashboardApi = {
  getUserData: async (): Promise<UserDashboardData> => {
    const response = await fetchAPI<UserDashboardData>('/dashboard/user');
    return response;
    
  }
};