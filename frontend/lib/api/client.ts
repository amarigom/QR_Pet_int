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
  if (options.body && !headers.has('content-type') && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. 🎯 CORRECCIÓN CLAVE: Inyectar token SOLO si es un string válido (no nulo, no vacío, no "null" / "undefined")
  if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
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
    method: metodo,
    cache: cacheConfig,
    body: bodyProcesado,
    headers: headers 
  });

  // AUDITORÍA DE RESPUESTA
  console.log("--- RESPUESTA DEL SERVIDOR ---");
  console.log(`[${res.status}] ${res.statusText} ➔ ${endpoint}`);
  
  // 🎯 CORRECCIÓN CLAVE: Si el backend devuelve 401 (Token expirado/inválido), limpiamos el localStorage de inmediato
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      console.warn("⚠️ Token expirado o inválido detectado. Limpiando localStorage...");
      localStorage.removeItem('token');
    }
  }

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
    
    // Crear objeto de error enriquecido con el status HTTP para capturarlo en catch(e)
    const err = new Error(errorMessage) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}