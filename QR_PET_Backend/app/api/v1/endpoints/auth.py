from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.api.v1.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo usuario en el sistema.
    Realiza validaciones de email único y hashea la contraseña.
    """
    auth_service = AuthService(db) 
    return await auth_service.register(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint compatible con OAuth2 para obtener el access_token.
    El campo 'username' debe contener el email del usuario.
    """
    auth_service = AuthService(db)
    
    # Mapeo de OAuth2 form a nuestro esquema interno
    login_data = UserLogin(
        email=form_data.username, 
        password=form_data.password
    )
    return await auth_service.login(login_data)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: User = Depends(get_current_user)
):
    """
    Retorna el perfil del usuario autenticado basándose en el token JWT.
    Como 'get_current_user' ya buscó al usuario en la DB, no hace falta
    llamar al service de nuevo (ahorro de una consulta SQL).
    """
    # Usamos model_validate directamente sobre el objeto 'user' inyectado
    return UserResponse.model_validate(user)