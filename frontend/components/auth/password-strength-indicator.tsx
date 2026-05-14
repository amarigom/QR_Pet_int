'use client'

import { validatePasswordStrength } from '@/lib/utils/validation';
import type { PasswordStrengthResult } from '@/lib/types/auth';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = validatePasswordStrength(password);

  const getScoreColor = (score: number) => {
    switch (score) {
      case 0:
        return 'bg-red-500';
      case 1:
        return 'bg-orange-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-lime-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getScoreTextColor = (score: number) => {
    switch (score) {
      case 0:
        return 'text-red-600';
      case 1:
        return 'text-orange-600';
      case 2:
        return 'text-yellow-600';
      case 3:
        return 'text-lime-600';
      case 4:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      {password && (
        <>
          {/* Barra de fortaleza */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getScoreColor(strength.score)}`}
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>

          {/* Mensaje de fortaleza */}
          <p className={`text-xs font-medium ${getScoreTextColor(strength.score)}`}>
            {strength.message}
          </p>

          {/* Lista de requisitos */}
          <div className="space-y-1 mt-3">
            <p className="text-xs font-medium text-gray-600">Requisitos:</p>
            <div className="space-y-1">
              <RequirementRow
                met={strength.requirements.minLength}
                text="Mínimo 8 caracteres"
              />
              <RequirementRow
                met={strength.requirements.hasLetter}
                text="Al menos una letra (A-Z, a-z)"
              />
              <RequirementRow
                met={strength.requirements.hasNumber}
                text="Al menos un número (0-9)"
              />
              <RequirementRow
                met={strength.requirements.hasSpecial}
                text="Carácter especial (!@#$%^&*(),.?\":{}|<>)"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface RequirementRowProps {
  met: boolean;
  text: string;
}

function RequirementRow({ met, text }: RequirementRowProps) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
      )}
      <span className={`text-xs ${met ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}
