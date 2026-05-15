"""
Excepciones personalizadas de la aplicación
"""
from fastapi import HTTPException, status
from typing import Optional

class AuthenticationException(HTTPException):
    """Excepción para errores de autenticación"""
    def __init__(self, detail: str = "No autorizado"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedException(HTTPException):
    """Excepción para permisos insuficientes"""
    def __init__(self, detail: str = "Permiso denegado"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class ResourceNotFoundException(HTTPException):
    """Excepción para recurso no encontrado"""
    def __init__(self, resource: str = "Recurso", detail: Optional[str] = None):
        message = detail or f"{resource} no encontrado"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )


class InvalidDataException(HTTPException):
    """Excepción para datos inválidos"""
    def __init__(self, detail: str = "Datos inválidos"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class ConflictException(HTTPException):
    """Excepción para conflictos de datos"""
    def __init__(self, detail: str = "Conflicto en los datos"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

# En app/core/exceptions.py

class ResourceNotFoundException(Exception): # Esta seguro ya la tenés
    def __init__(self, resource: str):
        self.resource = resource

class ForbiddenException(Exception): # AGREGÁ ESTA
    def __init__(self, message: str = "No tienes permiso para realizar esta acción"):
        self.message = message
        
from typing import Optional
