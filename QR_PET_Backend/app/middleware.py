from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

def setup_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        # Especifica el origen exacto de tu Next.js
        allow_origins=["http://localhost:3000"], 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )