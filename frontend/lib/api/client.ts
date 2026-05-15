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
  // 1. Intentamos obtener el JSON del error
  const errorData = await res.json().catch(() => ({}));
  
  let errorMessage = `Error ${res.status}: ${res.statusText}`;

  // 2. Analizamos la estructura de 'detail' de FastAPI
  if (errorData.detail) {
    if (Array.isArray(errorData.detail)) {
      // Caso 422: Error de validación (Pydantic)
      // Extraemos el campo y el mensaje para que sea más claro: "nombre: field required"
      const firstError = errorData.detail[0];
      const field = firstError.loc?.[firstError.loc.length - 1];
      errorMessage = field 
        ? `${field}: ${firstError.msg}` 
        : firstError.msg;
    } else {
      // Caso 400/403/404: Error de lógica (como el de "correo ya registrado")
      errorMessage = errorData.detail;
    }
  }
  
  throw new Error(errorMessage);
}

if (res.status === 204) return {} as T;
return res.json();}