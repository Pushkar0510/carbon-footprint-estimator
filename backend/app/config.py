"""Environment configuration settings loader using python-dotenv and Pydantic."""
import os
from dotenv import load_dotenv

# Load root .env first, fallback to backend/.env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
root_env = os.path.join(BASE_DIR, ".env")
backend_env = os.path.join(BASE_DIR, "backend", ".env")

if os.path.exists(root_env):
    load_dotenv(root_env)
elif os.path.exists(backend_env):
    load_dotenv(backend_env)


class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cfe-secret-key-12345")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/carbon")
    GRID_DATA_PATH: str = os.getenv("GRID_DATA_PATH", "./data/india_grid.json")
    DEFAULT_REGION: str = os.getenv("DEFAULT_REGION", "Maharashtra")
    DEFAULT_PROJECT_ID: str = os.getenv("DEFAULT_PROJECT_ID", "default")
    DEFAULT_CARBON_BUDGET_G: float = float(os.getenv("DEFAULT_CARBON_BUDGET_G", "5000.0"))
    DEFAULT_POWER_WATTS: float = float(os.getenv("DEFAULT_POWER_WATTS", "50.0"))
    EXECUTION_TIMEOUT_SECONDS: int = int(os.getenv("EXECUTION_TIMEOUT_SECONDS", "30"))


settings = Settings()
