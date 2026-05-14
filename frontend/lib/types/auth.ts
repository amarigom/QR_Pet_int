export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  // Actualizado con nuevos roles: SUPERADMIN, ADMIN_GENERAL, ADMIN, USER
  rol: 'superadmin' | 'admin_general' | 'admin' | 'usuario'; 
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

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4; // 0 = muy débil, 4 = muy fuerte
  message: string;
  requirements: {
    minLength: boolean;      // 8+ caracteres
    hasLetter: boolean;      // Al menos una letra
    hasNumber: boolean;      // Al menos un número
    hasSpecial: boolean;     // Al menos un carácter especial
  };
}
