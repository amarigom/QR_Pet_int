// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log("--- AUDITORÍA DE FETCH ---");
  console.log("Endpoint:", endpoint);
  if (options.body) {
    console.log("Contenido del body enviado:", options.body);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 1. 🛡️ Inicializamos Headers nativos
  const headers = new Headers(options.headers);

  // 2. 🎯 CORRECCIÓN DE QA: Solo seteamos Content-Type si la petición TIENE un cuerpo (POST, PUT, PATCH)
  // Evitamos inyectarlo en peticiones GET, previniendo conflictos de red y bucles de re-intento.
  if (options.body && !headers.has('content-type') && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. Inyectamos el token de autorización si existe
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 4. Serializamos el body una sola vez si es un objeto puro
  const bodyProcesado = options.body && typeof options.body === 'object'
    ? JSON.stringify(options.body)
    : options.body;

  const metodo = options.method || 'GET';
  const cacheConfig = options.cache || (metodo === 'GET' ? 'no-store' : undefined);
    // 5. Hacemos el fetch limpio pasando las opciones unificadas
  const res = await fetch(`${API_BASE}${endpoint}`, { 
    ...options, 
    headers,
    body: bodyProcesado 
  });

  // AUDITORÍA DE RESPUESTA
  console.log("--- RESPUESTA DEL SERVIDOR ---");
  console.log(`[${res.status}] ${res.statusText} ➔ ${endpoint}`);
  
  // Manejo de errores robusto para evitar el [object Object]
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errorMessage = `Error ${res.status}: ${res.statusText}`;

    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        const firstError = errorData.detail[0];
        const field = firstError.loc?.[firstError.loc.length - 1];
        errorMessage = field ? `${field}: ${firstError.msg}` : firstError.msg;
      } else {
        errorMessage = errorData.detail;
      }
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}