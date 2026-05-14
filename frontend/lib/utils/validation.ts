import type { PasswordStrengthResult } from '@/lib/types/auth';

/**
 * Valida la fuerza de una contraseña según los requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra (mayúscula o minúscula)
 * - Al menos un número
 * - Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?"":{}|<>]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let message = '';

  if (metRequirements === 0) {
    score = 0;
    message = 'Muy débil - Ingresa una contraseña';
  } else if (metRequirements === 1) {
    score = 1;
    message = 'Débil - Agrega más variedad';
  } else if (metRequirements === 2) {
    score = 2;
    message = 'Media - Casi lista';
  } else if (metRequirements === 3) {
    score = 3;
    message = 'Fuerte - Buen trabajo';
  } else {
    score = 4;
    message = 'Muy fuerte - Excelente';
  }

  return {
    score,
    message,
    requirements,
  };
}

/**
 * Valida el formato del correo electrónico
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que los campos requeridos no estén vacíos
 */
export function validateRequiredFields(fields: Record<string, string | undefined>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} es requerido`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Obtiene mensajes de error para cada requisito de contraseña
 */
export function getPasswordRequirementErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Agrega al menos una letra (A-Z, a-z)');
  }

  if (!/\d/.test(password)) {
    errors.push('Agrega al menos un número (0-9)');
  }

  if (!/[!@#$%^&*(),.?"":{}|<>]/.test(password)) {
    errors.push('Agrega un carácter especial (!@#$%^&*(),.?":{}|<>)');
  }

  return errors;
}

/**
 * Valida que la contraseña cumpla con todos los requisitos
 */
export function isPasswordValid(password: string): boolean {
  const strength = validatePasswordStrength(password);
  return strength.score === 4;
}
