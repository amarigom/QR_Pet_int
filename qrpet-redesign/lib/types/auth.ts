export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  // Cambié 'user' por 'usuario' para que coincida con tu base de datos de Python
  rol: 'admin' | 'usuario'; 
  avatar_url: string | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  nombre: string;
  telefono?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  // Usamos la interfaz User que definimos arriba. ¡Mucho más limpio!
  user: User; 
}

export interface ApiError {
  detail: string;
}
export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}