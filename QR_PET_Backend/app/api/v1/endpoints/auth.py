from fastapi import APIRouter, Depends, status, Request, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports de Esquemas
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse

# 2. Core y Seguridad
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Registra un nuevo usuario en el sistema.
    """
    try:
        # Obtener el body como JSON directamente
        body = await request.json()
        user_data = UserCreate(**body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except TypeError as e:
        raise HTTPException(status_code=422, detail=f"Missing or invalid fields: {str(e)}")
    
    auth_service = AuthService(db)
    result = await auth_service.register(user_data)
    
    return UserResponse.model_validate(result)

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
    return UserResponse.model_validate(current_user)
