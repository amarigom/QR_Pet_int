from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

def setup_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # En producción podés poner tu URL de Vercel específica
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )