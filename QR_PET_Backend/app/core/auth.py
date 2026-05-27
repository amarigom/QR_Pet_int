"""
Gestión de autenticación JWT y hashing de contraseñas
"""
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from app.config import settings
from app.core.exceptions import AuthenticationException
from passlib.context import CryptContext



# Contexto para hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__handle_long_passwords=True)


def hash_password(password: str) -> str:
    """Genera hash de contraseña"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Forzamos la verificación asegurándonos de que no haya nulos
        if not hashed_password or not plain_password:
            return False
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Error en verificación: {e}")
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodifica y valida un token JWT"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationException("Token expirado")
    except jwt.InvalidTokenError:
        raise AuthenticationException("Token inválido")


def generate_qr_code() -> str:
    """Genera un código QR único"""
    return secrets.token_urlsafe(8)[:12].upper()
