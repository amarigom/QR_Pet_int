'use client';

import React, { useReducer, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from './AuthContext'; // Corregido: un solo punto
import { authReducer } from './AuthReducer'; // Corregido: un solo punto
import { authService } from '@/lib/services';
import { AuthState } from './types';


// función segura para inicializar el Modo Usuario
const getInitialModoUsuario = (): boolean => {
  if (typeof window !== 'undefined') {
    const guardado = localStorage.getItem('enModoUsuario');
    // Si hay un valor guardado lo usamos, si no, que arranque por defecto en true (modo usuario) o false
    return guardado ? JSON.parse(guardado) : true; 
  }
  return true;
};

// función al initialState
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  enModoUsuario: getInitialModoUsuario(), // 👈 ¡Ahora arranca con el valor real del navegador!
};



export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: 'AUTH_LOADED', payload: { user: null, token: null } });
        return;
      }

      try {
        const user = await authService.getCurrentUser(); 
        
        // Guardamos solo el objeto user limpio
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        dispatch({ 
          type: 'AUTH_LOADED', 
          payload: { user, token } 
        });
      } catch (error) {
        console.error("Token inválido o expirado");
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        dispatch({ type: 'AUTH_LOADED', payload: { user: null, token: null } });
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
  dispatch({ type: 'SET_LOADING', payload: true });
  try {
    console.log("DEBUG 1: Iniciando llamada al servicio...");
    const result = await authService.login({ email, password });
    
    console.log("DEBUG 2: Respuesta recibida:", result);

    if (!result) {
      console.error("DEBUG ERROR: El servicio no devolvió nada");
      return;
    }

    const token = result.access_token;
    const userData = result.user;

    console.log("DEBUG 3: Intentando guardar token:", token);
    localStorage.setItem('token', token);
    
    console.log("DEBUG 4: Intentando guardar usuario:", userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));

    console.log("DEBUG 5: ¡TODO GUARDADO EN LOCALSTORAGE!");

    dispatch({ 
      type: 'LOGIN_SUCCESS', 
      payload: { user: userData, token: token } 
    });

    router.push('/dashboard');
  } catch (error) {
    console.error("DEBUG CRASH: El código explotó aquí:", error);
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
}, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  }, [router]);

  // Calculamos isAdmin basándonos en el objeto completo
  const isAdmin = state.user?.rol === 'admin';
  const toggleModoVista = () => {
  dispatch({ type: 'TOGGLE_MODO_VISTA' });
};

  return (
    <AuthContext.Provider value={{ ...state, login, logout,isAdmin: state.user?.rol === 'admin',
    toggleModoVista }}>
      {children}
    </AuthContext.Provider>
  );
};
