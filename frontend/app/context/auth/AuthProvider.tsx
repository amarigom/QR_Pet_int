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
    return localStorage.getItem('enModoUsuario') !== 'false'
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
    const result = await authService.login({ email, password });

    if (!result) {
      throw new Error('El servidor no devolvió los datos de inicio de sesión.');
    }

    const token = result.access_token;
    const userData = result.user;

    if (!token || !userData) {
      throw new Error('La respuesta de inicio de sesión está incompleta.');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('enModoUsuario', 'true');

    dispatch({ 
      type: 'LOGIN_SUCCESS', 
      payload: { user: userData, token: token }
    });
    dispatch({ type: 'SET_MODO_USUARIO', payload: true });

    router.push('/dashboard');
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
}, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('enModoUsuario');
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  }, [router]);

  const toggleModoVista = useCallback(() => {
    if (state.user?.rol !== 'admin') return

    const nextMode = !state.enModoUsuario
    localStorage.setItem('enModoUsuario', String(nextMode))
    dispatch({ type: 'SET_MODO_USUARIO', payload: nextMode })
  }, [state.enModoUsuario, state.user?.rol])

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      isAdmin: state.user?.rol === 'admin',
      toggleModoVista,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
