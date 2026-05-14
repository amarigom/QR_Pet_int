"""
Constantes y enums de la aplicación
"""
from enum import Enum
import re


class UserRole(str, Enum):
    """Roles de usuario - Jerarquía: SUPERADMIN > ADMIN_GENERAL > ADMIN > USER"""
    SUPERADMIN = "superadmin"      # Acceso total al sistema
    ADMIN_GENERAL = "admin_general"  # Administrador de toda la app (sin permisos de superadmin)
    ADMIN = "admin"                # Administrador estándar
    USER = "usuario"               # Usuario regular


class PetStatus(str, Enum):
    ACTIVO = "activo"
    ENCONTRADO = "encontrado"
    FALLECIDO = "fallecido"
    OTRO = "otro"
    EN_CASA = "en_casa"  


class AnimalSpecies(str, Enum):
    """Especies de animales"""
    PERRO = "perro"
    GATO = "gato"
    PAJARO = "pajaro"
    CONEJO = "conejo"
    HAMSTER = "hamster"
    OTRO = "otro"


# Constantes de validación
MIN_PASSWORD_LENGTH = 8  # Cambiar de 6 a 8
MAX_QR_BATCH_SIZE = 100
MIN_QR_BATCH_SIZE = 1

# Regex para validación de contraseña
PASSWORD_PATTERN = r"^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$"

def validate_password(password: str) -> tuple[bool, str]:
    """
    Valida que una contraseña cumpla con los requisitos:
    - Mínimo 8 caracteres
    - Al menos una letra (mayúscula o minúscula)
    - Al menos un número
    - Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)
    
    Returns:
        tuple: (es_válida, mensaje_error)
    """
    if not password:
        return False, "La contraseña es requerida"
    
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres"
    
    if not re.search(r'[a-zA-Z]', password):
        return False, "La contraseña debe contener al menos una letra"
    
    if not re.search(r'\d', password):
        return False, "La contraseña debe contener al menos un número"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?\":{}|<>)"
    
    return True, "Contraseña válida"

# Mensajes
MESSAGE_EMAIL_EXISTS = "El correo electrónico ya está registrado"
MESSAGE_USER_NOT_FOUND = "Usuario no encontrado"
MESSAGE_INVALID_CREDENTIALS = "Credenciales inválidas"
MESSAGE_QR_NOT_FOUND = "Código QR no encontrado o no disponible"
MESSAGE_QR_ALREADY_LINKED = "Este QR ya está vinculado a una mascota"
MESSAGE_CANNOT_DELETE_SELF = "No puedes eliminarte a ti mismo"
MESSAGE_CANNOT_MODIFY_SELF_ROLE = "No puedes cambiar tu propio rol"
