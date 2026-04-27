"""
Funciones de validación personalizadas
"""
import re
from typing import Optional
from app.core.exceptions import InvalidDataException


def validate_email(email: str) -> bool:
    """Valida formato de correo electrónico"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone: str) -> bool:
    """Valida formato de teléfono"""
    # Acepta números con guiones, espacios y paréntesis
    pattern = r'^[\d\s\-\(\)\+]+$'
    return len(phone) >= 7 and re.match(pattern, phone) is not None


def validate_password(password: str, min_length: int = 6) -> bool:
    """Valida requisitos de contraseña"""
    if len(password) < min_length:
        raise InvalidDataException(f"La contraseña debe tener al menos {min_length} caracteres")
    return True


def validate_qr_quantity(quantity: int, min_val: int = 1, max_val: int = 100):
    """Valida la cantidad de QRs a generar"""
    if quantity < min_val or quantity > max_val:
        raise InvalidDataException(
            f"La cantidad debe estar entre {min_val} y {max_val}"
        )
    return True


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """Sanitiza y valida un string"""
    if not isinstance(value, str):
        raise InvalidDataException("El valor debe ser una cadena de texto")
    
    value = value.strip()
    
    if not value:
        raise InvalidDataException("El valor no puede estar vacío")
    
    if max_length and len(value) > max_length:
        raise InvalidDataException(f"El valor no puede exceder {max_length} caracteres")
    
    return value
