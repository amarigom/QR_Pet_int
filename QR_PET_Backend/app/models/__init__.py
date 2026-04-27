# app/models/__init__.py
from .base import Base
from .user import User
from .pet import Pet
from .qr import QRCode

# Esto facilita importar todo desde un solo lugar: 
# from app.models import User, Pet
__all__ = ["Base", "User", "Pet", "QRCode"]