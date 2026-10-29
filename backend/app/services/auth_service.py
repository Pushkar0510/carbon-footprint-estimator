"""Authentication service handling bcrypt password security and JWT tokens."""
import datetime
import bcrypt
import jwt
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.app.config import settings
from backend.app.db.mongodb import (
    db_create_user,
    db_find_user_by_username,
    db_find_user_by_email,
    db_set_budget,
)

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7-day token
JWT_SECRET = settings.SECRET_KEY if len(settings.SECRET_KEY) >= 32 else (settings.SECRET_KEY + "-cfe-jwt-secret-pad-32characters-minimum")

http_bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    pw_bytes = password.encode("utf-8")[:72]  # bcrypt 72-byte max
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta or datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    )
    to_encode.update({"exp": expire, "iat": datetime.datetime.now(datetime.timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None


async def register_user(username: str, email: str, password: str) -> Dict[str, Any]:
    """Register a new user and initialize their default project and carbon budget."""
    uname = username.strip()
    em = email.strip()

    if len(uname) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if "@" not in em or "." not in em:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    existing_u = await db_find_user_by_username(uname)
    if existing_u:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    existing_e = await db_find_user_by_email(em)
    if existing_e:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    hashed_pw = hash_password(password)
    default_proj_id = f"proj-{uname.lower()}"

    user_doc = {
        "username": uname,
        "email": em,
        "hashed_password": hashed_pw,
        "default_project_id": default_proj_id,
        "role": "developer",
    }
    created = await db_create_user(user_doc)

    # Initialize personal carbon budget
    await db_set_budget(
        project_id=default_proj_id,
        monthly_limit_grams=settings.DEFAULT_CARBON_BUDGET_G,
        user_id=created.get("id"),
    )

    # Issue access token
    token = create_access_token({"sub": created.get("id"), "username": uname, "email": em})

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": uname,
        "email": em,
        "default_project_id": default_proj_id,
        "id": created.get("id"),
    }


async def authenticate_user(username_or_email: str, password: str) -> Dict[str, Any]:
    """Authenticate user by username or email and return JWT token."""
    identifier = username_or_email.strip()
    user = await db_find_user_by_username(identifier)
    if not user:
        user = await db_find_user_by_email(identifier)

    if not user or not verify_password(password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    uname = user.get("username")
    em = user.get("email")
    default_proj_id = user.get("default_project_id") or f"proj-{uname.lower()}"

    token = create_access_token({"sub": user.get("id"), "username": uname, "email": em})

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": uname,
        "email": em,
        "default_project_id": default_proj_id,
        "id": user.get("id"),
    }


async def get_optional_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer_scheme),
) -> Optional[Dict[str, Any]]:
    """FastAPI dependency: resolves current user if Bearer token present, else returns None (Guest)."""
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload:
        return None

    username = payload.get("username")
    if not username:
        return None

    user = await db_find_user_by_username(username)
    if user:
        user.pop("hashed_password", None)
    return user


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer_scheme),
) -> Dict[str, Any]:
    """FastAPI dependency: requires valid Bearer token."""
    user = await get_optional_current_user(auth)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
