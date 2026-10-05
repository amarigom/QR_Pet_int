import { User, AuthResponse } from '@/lib/types/auth';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  enModoUsuario: boolean; 

}

export type AuthAction =
  | { type: 'AUTH_LOADED'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODO_USUARIO'; payload: boolean };

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  toggleModoVista: () => void;
}