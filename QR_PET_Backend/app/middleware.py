from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

def setup_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        # Especifica el origen exacto de tu Next.js
        allow_origins=["http://localhost:3000","https://qr-pet-int-frontendprueba-andreas-projects-71d69b69.vercel.app"], 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )