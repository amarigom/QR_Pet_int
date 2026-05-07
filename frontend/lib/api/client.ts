// lib/api/client.ts
// Definimos la constante que falta
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 1. Extraemos los headers que vienen por opciones
  const customHeaders = options.headers ? Object.fromEntries(new Headers(options.headers).entries()) : {};

  // 2. Combinamos: El Content-Type por defecto es JSON, pero si customHeaders trae otro, lo pisa
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...customHeaders, 
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. Ejecutamos la petición usando API_BASE
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // Manejo de errores robusto para evitar el [object Object]
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error desconocido' }));
    
    // Si FastAPI devuelve un array de errores (422), extraemos el mensaje del primero
    const errorMessage = Array.isArray(error.detail) 
      ? error.detail[0]?.msg 
      : (error.detail || `Error ${res.status}: ${res.statusText}`);
      
    throw new Error(errorMessage);
  }

  if (res.status === 204) return {} as T;

  return res.json();
}