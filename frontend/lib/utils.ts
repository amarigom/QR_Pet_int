import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función auxiliar para parsear fechas ISO de PostgreSQL de forma segura
function parseISO(dateInput: Date | string): Date {
  if (dateInput instanceof Date) return dateInput;
  
  // Si viene una fecha en string ISO sin la 'Z' al final (ej: "2026-09-23T14:30:00"),
  // le agregamos la 'Z' para forzar a JavaScript a interpretarla como UTC.
  let dateStr = dateInput;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr += 'Z';
  }
  return new Date(dateStr);
}

export function formatDate(date: Date | string): string {
  const d = parseISO(date);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires', // Forzamos zona horaria de Argentina
  });
}

export function formatDateTime(date: Date | string): string {
  const d = parseISO(date);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires', // Forzamos zona horaria de Argentina
  });
}

export function generateQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ==========================================
// LÓGICA DE RESOLUCIÓN DE ROLES Y VISTAS
// ==========================================

export type UserRole = 'admin' | 'veterinario' | 'user'
export type ActiveView = 'admin' | 'veterinario' | 'user'




/**
 * Resuelve la vista activa cruzando el rol real del usuario con el switch de Modo Usuario.
 */
export function resolverVistaValida(rol?: string, enModoUsuario: boolean = true): ActiveView {
  const rolLimpio = (rol || 'user').toLowerCase().trim()

  // 1. Si el usuario activó la vista de usuario común, SIEMPRE se muestra 'user'
  if (enModoUsuario) {
    return 'user'
  }

  // 2. Si desactivó el modo usuario (quiere ver su panel profesional), validamos sus permisos reales
  if (rolLimpio === 'admin') {
    return 'admin'
  }

  if (rolLimpio === 'veterinario') {
    return 'veterinario'
  }

  // 3. Fallback de seguridad: Si un usuario común apaga la bandera, la fuerza a 'user'
  return 'user'
}