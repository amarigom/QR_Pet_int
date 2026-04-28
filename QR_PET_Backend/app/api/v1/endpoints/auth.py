from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Esquemas (Ahora SEGUROS y directos)
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse

# 2. Core y Seguridad
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.models.user import User  # Importamos el modelo para la anotación del Depends

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo usuario en el sistema.
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
    """
    auth_service = AuthService(db)
    
    login_data = UserLogin(
        email=form_data.username, 
        password=form_data.password
    )
    return await auth_service.login(login_data)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna el perfil del usuario autenticado.
    """
    # Al ser UserResponse un esquema atómico, model_validate funciona perfecto
    return UserResponse.model_validate(current_user)