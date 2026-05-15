// lib/services.ts

// 1. Clase para manejar errores de la API
export class APIError extends Error {
  constructor(public detail: string, public status?: number) {
    super(detail);
    this.name = 'APIError';
  }
}

// 2. URL de tu backend (FastAPI)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const authService = {
  async login(credentials: { email: string; password: string }) {
    // 1. FastAPI OAuth2 requiere URLSearchParams (Form Data)
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // FastAPI usa 'username' por defecto
    formData.append('password', credentials.password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        // Cambiamos el header para cumplir el protocolo OAuth2
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejo de error aplanado (QA Focus)
      const errorMsg = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
      throw new APIError(errorMsg || 'Error en el login', response.status);
    }

    return data; // Retorna { access_token: "...", token_type: "bearer", user: {...} }
  },

  async register(userData: any) {
    // El registro SÍ suele ser JSON en FastAPI (usando esquemas Pydantic)
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(data.detail || 'Error en el registro', response.status);
    }
    return data;
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    // ... resto de tu lógica de validación
    return await response.json();
  }
};