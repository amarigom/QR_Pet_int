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
