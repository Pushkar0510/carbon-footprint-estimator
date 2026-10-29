"""Authentication router for developer registration, login, and profile."""
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.models.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserProfileResponse,
)
from backend.app.services.auth_service import (
    register_user,
    authenticate_user,
    get_current_user,
)
from backend.app.db.mongodb import is_mongo_connected

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    """Register a new developer account and return JWT access token."""
    return await register_user(req.username, req.email, req.password)



@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    """Log in with username/email and password to receive JWT token."""
    return await authenticate_user(req.username, req.password)


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve profile and default project for authenticated user."""
    return {
        "id": current_user.get("id"),
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "default_project_id": current_user.get("default_project_id", f"proj-{current_user.get('username').lower()}"),
        "role": current_user.get("role", "developer"),
    }


@router.get("/status")
async def get_auth_system_status():
    """Return whether connected to live MongoDB or using resilient in-memory storage."""
    connected = is_mongo_connected()
    return {
        "database": "mongodb" if connected else "resilient-in-memory",
        "mongo_connected": connected,
        "mongodb_connected": connected,
        "status": "ready",
    }

