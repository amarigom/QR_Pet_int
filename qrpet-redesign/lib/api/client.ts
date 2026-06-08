// lib/api/client.ts
// Definimos la constante que falta
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log("--- AUDITORÍA DE FETCH ---");
  console.log("Endpoint:", endpoint);
  console.log("Contenido del body recibido:", options.body);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 1. 🛡️ Inicializamos Headers nativos usando lo que venga del servicio (si viene algo)
  const headers = new Headers(options.headers);

  // 2. Si el servicio NO configuró un Content-Type, le ponemos application/json por defecto
  if (!headers.has('content-type') && !headers.has('Content-Type')) {
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

  // 5. Hacemos el fetch limpio pasando las opciones originales pero sobreescribiendo body y headers
  const res = await fetch(`${API_BASE}${endpoint}`, { 
    ...options, 
    headers,        // 👈 Instancia nativa unificada de Headers
    body: bodyProcesado 
  });
  //AUDITORÍA 
  console.log("--- RESPUESTA DEL SERVIDOR ---");
  console.log("Status Code:", res.status);
  console.log("Status Text:", res.statusText);
  
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