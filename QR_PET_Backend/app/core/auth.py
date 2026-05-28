"""
Gestión de autenticación JWT y hashing de contraseñas
"""


from app.config import settings
from app.core.exceptions import AuthenticationException
from jwt.exceptions import InvalidTokenError

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher


password_hash = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    """Genera hash de contraseña de forma segura y compatible con Python 3.12/3.13"""
    return password_hash.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la contraseña usando pwdlib, tolerando hashes previos de bcrypt"""
    try:
        # Aseguramos que no haya valores nulos o vacíos
        if not hashed_password or not plain_password:
            return False
        
        return password_hash.verify(plain_password, hashed_password)
    except (PasswordValueError, Exception) as e:
        print(f"Error en verificación de hash: {e}")
        return False

# 2. Manejo de Tokens JWT
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT usando la hora actual con zona horaria (limpio y sin deprecaciones)"""
    to_encode = data.copy()
    
    # Usamos timezone.utc porque datetime.utcnow() está obsoleto en Python moderno
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
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

# 3. Utilidades adicionales
def generate_qr_code() -> str:
    """Genera un código QR único"""
    return secrets.token_urlsafe(8)[:12].upper()