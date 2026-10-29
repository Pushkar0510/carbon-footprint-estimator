"""Database package initialization."""
from backend.app.db.mongodb import (
    init_mongo_db,
    close_mongo_db,
    is_mongo_connected,
    db_create_user,
    db_find_user_by_username,
    db_find_user_by_email,
    db_save_profile_run,
    db_get_profile_history,
    db_get_profile_run_by_id,
    db_set_budget,
    db_record_emissions,
    db_get_budget,
)
