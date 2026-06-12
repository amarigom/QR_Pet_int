"""
Constantes y enums de la aplicación
"""
from enum import Enum


class UserRole(str, Enum):
    """Roles de usuario"""
    ADMIN = "admin"
    USER = "usuario"


class PetStatus(str, Enum):
    ACTIVO = "activo"
    ENCONTRADO = "encontrado"
    FALLECIDO = "fallecido"
    PERDIDO= "perdido"
    LIBRE="libre"
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
MIN_PASSWORD_LENGTH = 6
MAX_QR_BATCH_SIZE = 100
MIN_QR_BATCH_SIZE = 1

# Mensajes
MESSAGE_EMAIL_EXISTS = "El correo electrónico ya está registrado"
MESSAGE_USER_NOT_FOUND = "Usuario no encontrado"
MESSAGE_INVALID_CREDENTIALS = "Credenciales inválidas"
MESSAGE_QR_NOT_FOUND = "Código QR no encontrado o no disponible"
MESSAGE_QR_ALREADY_LINKED = "Este QR ya está vinculado a una mascota"
MESSAGE_CANNOT_DELETE_SELF = "No puedes eliminarte a ti mismo"
MESSAGE_CANNOT_MODIFY_SELF_ROLE = "No puedes cambiar tu propio rol"
