"""
Excepciones personalizadas de la aplicación (app/core/exceptions.py)
"""
from typing import Optional
from fastapi import HTTPException, status


class AuthenticationException(HTTPException):
    """Excepción para errores de autenticación (401)"""
    def __init__(self, detail: str = "No autorizado"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedException(HTTPException):
    """Excepción para permisos insuficientes (403)"""
    def __init__(self, detail: str = "Permiso denegado"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


# Alias de conveniencia por si en alguna parte usas ForbiddenException
class ForbiddenException(PermissionDeniedException):
    """Alias para PermissionDeniedException"""
    def __init__(self, message: str = "No tienes permiso para realizar esta acción"):
        super().__init__(detail=message)


class ResourceNotFoundException(HTTPException):
    """Excepción para recurso no encontrado (404)"""
    def __init__(self, resource: str = "Recurso", detail: Optional[str] = None):
        message = detail or f"{resource} no encontrado"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )


class InvalidDataException(HTTPException):
    """Excepción para datos inválidos (400)"""
    def __init__(self, detail: str = "Datos inválidos"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class ConflictException(HTTPException):
    """Excepción para conflictos de datos (409)"""
    def __init__(self, detail: str = "Conflicto en los datos"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )