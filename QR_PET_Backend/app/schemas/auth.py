from pydantic import BaseModel
from app.schemas.user import UserResponse  # O como se llame tu esquema que lee el usuario completo

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse  # <- Acá anidamos el objeto usuario

    class Config:
        from_attributes = True
        
        
