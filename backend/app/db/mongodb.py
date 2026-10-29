"""MongoDB async client, connection manager, and resilient repository."""
import os
import uuid
import datetime
import logging
from typing import Optional, Dict, Any, List

try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
    MOTOR_AVAILABLE = True
except ImportError:
    AsyncIOMotorClient = None
    AsyncIOMotorDatabase = None
    MOTOR_AVAILABLE = False

from backend.app.config import settings

logger = logging.getLogger("carbon_estimator.db")

_mongo_client: Optional[Any] = None
_mongo_db: Optional[Any] = None
_is_connected: bool = False

# Resilient in-memory fallback stores (used if MongoDB instance is unreachable or offline)
_MEM_USERS: Dict[str, Dict[str, Any]] = {}
_MEM_RUNS: List[Dict[str, Any]] = []
_MEM_BUDGETS: Dict[str, Dict[str, Any]] = {}
_MEM_PROJECTS: Dict[str, Dict[str, Any]] = {}


async def init_mongo_db() -> bool:
    """Initialize MongoDB connection with fast timeout fallback."""
    global _mongo_client, _mongo_db, _is_connected
    if not MOTOR_AVAILABLE:
        _is_connected = False
        logger.info("Motor library not installed. Using resilient in-memory persistence.")
        return False

    uri = settings.MONGODB_URI or "mongodb://localhost:27017/carbon"

    try:
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=1200)
        # Attempt lightweight ping
        await _mongo_client.admin.command("ping")
        # Extract DB name from URI or default to 'carbon'
        db_name = uri.split("/")[-1].split("?")[0] or "carbon"
        _mongo_db = _mongo_client[db_name]
        _is_connected = True
        logger.info(f"Connected to MongoDB at {uri} (Database: {db_name})")
        return True
    except Exception as e:
        _is_connected = False
        _mongo_db = None
        logger.warning(f"MongoDB connection to {uri} not reachable ({e}). Using resilient in-memory persistence.")
        return False


async def close_mongo_db():
    """Close MongoDB connection pool on shutdown."""
    global _mongo_client, _mongo_db, _is_connected
    if _mongo_client:
        _mongo_client.close()
        _is_connected = False


def is_mongo_connected() -> bool:
    """Return whether connected to live MongoDB server."""
    return _is_connected


# ─────────────────────────────────────────────
# DATABASE REPOSITORY METHODS (With fallback)
# ─────────────────────────────────────────────

async def db_create_user(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Insert new user into database."""
    user_doc = dict(user_doc)
    user_doc.setdefault("id", f"usr-{uuid.uuid4().hex[:10]}")
    user_doc.setdefault("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat())

    if _is_connected and _mongo_db is not None:
        try:
            await _mongo_db["users"].insert_one(dict(user_doc))
            return user_doc
        except Exception as e:
            logger.warning(f"MongoDB insert error: {e}. Storing in memory fallback.")

    _MEM_USERS[user_doc["username"].lower()] = user_doc
    return user_doc


async def db_find_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Find user by username."""
    if not username:
        return None
    uname_lower = username.strip().lower()

    if _is_connected and _mongo_db is not None:
        try:
            doc = await _mongo_db["users"].find_one({"username": {"$regex": f"^{uname_lower}$", "$options": "i"}})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception:
            pass

    return _MEM_USERS.get(uname_lower)


async def db_find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Find user by email."""
    if not email:
        return None
    em_lower = email.strip().lower()

    if _is_connected and _mongo_db is not None:
        try:
            doc = await _mongo_db["users"].find_one({"email": {"$regex": f"^{em_lower}$", "$options": "i"}})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception:
            pass

    for u in _MEM_USERS.values():
        if u.get("email", "").lower() == em_lower:
            return u
    return None


async def db_save_profile_run(run_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Save profile run report."""
    run_doc = dict(run_doc)
    run_doc.setdefault("saved_at", datetime.datetime.now(datetime.timezone.utc).isoformat())

    if _is_connected and _mongo_db is not None:
        try:
            await _mongo_db["profile_runs"].insert_one(dict(run_doc))
            return run_doc
        except Exception:
            pass

    _MEM_RUNS.insert(0, run_doc)
    return run_doc


async def db_get_profile_history(project_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get historical profile runs for a project."""
    if _is_connected and _mongo_db is not None:
        try:
            cursor = _mongo_db["profile_runs"].find({"projectId": project_id}).sort("timestamp", -1).limit(limit)
            runs = []
            async for r in cursor:
                r.pop("_id", None)
                runs.append(r)
            if runs:
                return runs
        except Exception:
            pass

    return [r for r in _MEM_RUNS if r.get("projectId") == project_id][:limit]


async def db_get_profile_run_by_id(run_id: str) -> Optional[Dict[str, Any]]:
    """Get single profile run by runId."""
    if _is_connected and _mongo_db is not None:
        try:
            doc = await _mongo_db["profile_runs"].find_one({"runId": run_id})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception:
            pass

    for r in _MEM_RUNS:
        if r.get("runId") == run_id:
            return r
    return None


async def db_set_budget(project_id: str, monthly_limit_grams: float, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Set or update monthly carbon budget."""
    if _is_connected and _mongo_db is not None:
        try:
            await _mongo_db["carbon_budgets"].update_one(
                {"projectId": project_id},
                {
                    "$set": {
                        "monthlyLimitGrams": monthly_limit_grams,
                        "userId": user_id,
                        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    },
                    "$setOnInsert": {"usedGrams": 0.0},
                },
                upsert=True,
            )
        except Exception:
            pass

    b = _MEM_BUDGETS.setdefault(project_id, {
        "projectId": project_id,
        "monthlyLimitGrams": float(monthly_limit_grams),
        "usedGrams": 0.0,
        "userId": user_id,
    })
    b["monthlyLimitGrams"] = float(monthly_limit_grams)
    return b


async def db_record_emissions(project_id: str, emissions_g: float) -> None:
    """Increment cumulative used emissions for project."""
    if emissions_g <= 0:
        return

    if _is_connected and _mongo_db is not None:
        try:
            await _mongo_db["carbon_budgets"].update_one(
                {"projectId": project_id},
                {
                    "$inc": {"usedGrams": float(emissions_g)},
                    "$setOnInsert": {
                        "monthlyLimitGrams": settings.DEFAULT_CARBON_BUDGET_G,
                        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    },
                },
                upsert=True,
            )
            return
        except Exception:
            pass

    b = _MEM_BUDGETS.setdefault(project_id, {
        "projectId": project_id,
        "monthlyLimitGrams": settings.DEFAULT_CARBON_BUDGET_G,
        "usedGrams": 0.0,
    })
    b["usedGrams"] = b.get("usedGrams", 0.0) + emissions_g


async def db_get_budget(project_id: str) -> Dict[str, Any]:
    """Retrieve budget status for project."""
    if _is_connected and _mongo_db is not None:
        try:
            doc = await _mongo_db["carbon_budgets"].find_one({"projectId": project_id})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception:
            pass

    return _MEM_BUDGETS.get(project_id, {
        "projectId": project_id,
        "monthlyLimitGrams": settings.DEFAULT_CARBON_BUDGET_G,
        "usedGrams": 0.0,
    })
