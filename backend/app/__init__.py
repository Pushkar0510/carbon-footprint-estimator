from fastapi import FastAPI

def create_app() -> FastAPI:
    from .main import app
    return app

__all__ = ["create_app"]
