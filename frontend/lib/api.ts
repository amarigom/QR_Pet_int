import type {
  User,
  Pet,
  QRCode,
  PetDetailResponse,
  DashboardStats,
  AdminStats,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PetFormData,
  Scan,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(error.detail || `Error ${res.status}`)
  }

  return res.json()
}

// Auth
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Convertimos el objeto directamente a formato de formulario
  // Cambiando 'email' por 'username' en una sola línea
  const body = new URLSearchParams({
    username: credentials.email,
    password: credentials.password
  }).toString();

  const res = await fetchAPI<AuthResponse>('/auth/login', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  localStorage.setItem('token', res.access_token);
  return res;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await fetchAPI<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  localStorage.setItem('token', res.access_token)
  return res
}

export async function logout(): Promise<void> {
  localStorage.removeItem('token')
}

export async function getCurrentUser(): Promise<User> {
  return fetchAPI<User>('/auth/me')
}

// Pets
export async function getPets(): Promise<Pet[]> {
  return fetchAPI<Pet[]>('/pets')
}

export async function getPet(id: string): Promise<PetDetailResponse> {
  return fetchAPI<PetDetailResponse>(`/pets/${id}`)
}

export async function createPet(data: PetFormData): Promise<Pet> {
  return fetchAPI<Pet>('/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePet(id: string, data: Partial<PetFormData>): Promise<Pet> {
  return fetchAPI<Pet>(`/pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePet(id: string): Promise<void> {
  await fetchAPI(`/pets/${id}`, {
    method: 'DELETE',
  })
}

// QR Codes
export async function generateQR(petId: string): Promise<QRCode> {
  return fetchAPI<QRCode>(`/qr/generate/${petId}`, {
    method: 'POST',
  })
}

export async function deactivateQR(qrId: string): Promise<void> {
  await fetchAPI(`/qr/${qrId}/deactivate`, {
    method: 'POST',
  })
}

// Public QR scan
export async function scanQR(
  code: string,
  location?: { lat: number; lng: number }
) {
  return fetchAPI<{ pet: Pet; owner: { nombre: string; telefono: string } }>(`/scan/${code}`, {
    method: 'POST',
    body: JSON.stringify(location || {}),
  })
}

// QR Activation (User)
export interface QRCheckResult {
  available: boolean
  message: string
  has_pet?: boolean
}

export async function checkQR(code: string): Promise<QRCheckResult> {
  return fetchAPI<QRCheckResult>(`/qr/check/${code}`)
}

export interface QRActivateData {
  codigo: string
  nombre: string
  especie: string
  raza?: string | null
  color?: string | null
  edad_aproximada?: string | null
  foto_url?: string | null
  notas?: string | null
}

export async function activateQR(data: QRActivateData): Promise<{ pet: Pet; qr: QRCode }> {
  return fetchAPI<{ pet: Pet; qr: QRCode }>('/qr/activate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAPI<DashboardStats>('/dashboard/stats')
}

// Admin
export async function getAdminStats(): Promise<AdminStats> {
  return fetchAPI<AdminStats>('/admin/stats')
}

export async function getAdminUsers(): Promise<User[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const response = await fetch(`${API_BASE}/admin/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al obtener los usuarios');
  }

  const data = await response.json();
  
  // Extraemos la lista del objeto que manda el backend
  return (data.items || []) as User[];
}

export async function getAdminPets(): Promise<(Pet & { owner_name: string })[]> {
  // 1. Obtenemos el token que guardaste en el login
  const token = localStorage.getItem('token');

  // 2. Ajustamos la URL si tu backend ahora usa el prefijo de la versión
  return fetchAPI<(Pet & { owner_name: string })[]>('/admin/pets', {
    method: 'GET',
    headers: {
      // 3. Inyectamos el token de seguridad
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await fetchAPI(`/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function toggleUserAdmin(userId: string): Promise<User> {
  return fetchAPI<User>(`/admin/users/${userId}/toggle-admin`, {
    method: 'POST',
  })
}

// Admin QR Management
export interface AdminQR {
  id: string
  codigo: string
  mascota_id: string | null
  mascota_nombre: string | null
  owner_name: string | null
  activo: boolean
  created_at: string
}

export async function getAdminQRs(): Promise<AdminQR[]> {
  return fetchAPI<AdminQR[]>('/admin/qr')
}

export async function generateAdminQRs(cantidad: number): Promise<{ created: number; qrs: QRCode[] }> {
  return fetchAPI<{ created: number; qrs: QRCode[] }>('/admin/qr/generate', {
    method: 'POST',
    body: JSON.stringify({ cantidad }),
  })
}

export async function deleteAdminQR(qrId: string): Promise<void> {
  await fetchAPI(`/admin/qr/${qrId}`, {
    method: 'DELETE',
  })
}
