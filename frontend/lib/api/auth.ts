import { fetchAPI } from './client';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // 1. Usamos URLSearchParams para cumplir con el estándar OAuth2 de FastAPI
    const params = new URLSearchParams();
    params.append('username', credentials.email); // Mapeo: email -> username
    params.append('password', credentials.password);

    // 2. Usamos fetchAPI (nuestro cliente inteligente)
    const data = await fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // 3. Persistencia profesional
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      if (data.user) {
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
    }

    return data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    // El registro se mantiene como JSON (estándar Pydantic)
    const res = await fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: data as any, // TypeScript a veces se queja con JSON.stringify, este "as any" lo soluciona
      headers: { 'Content-Type': 'application/json' },
    });
    console.log("Respuesta de registro:", res);
    if (res.access_token) {
      localStorage.setItem('token', res.access_token);
      if (res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
      }
    }
    return res;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // fetchAPI ya le inyecta el Bearer token automáticamente
      const user = await fetchAPI<User>('/auth/me');
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      // Si falla (token expirado), limpiamos
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      return null;
    }
  },

  updateProfile: async (data: { nombre: string; telefono: string }): Promise<User> => {
    const updatedUser = await fetchAPI<User>('/auth/me', {
      method: 'PUT',
      body: data as any, 
    });

    if (updatedUser) {
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }

    return updatedUser;
  }
}