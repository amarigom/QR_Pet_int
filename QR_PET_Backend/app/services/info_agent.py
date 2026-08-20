from typing import List, Dict, Any

class InfoAgent:
    @staticmethod
    async def get_nearby_veterinaries(lat: float, lng: float) -> List[Dict[str, Any]]:
        # TODO: Conectar con PostgreSQL / SQLAlchemy
        return [
            {
                "nombre": "Veterinaria Central",
                "direccion": "San Martín 500, Tandil",
                "de_turno": True,
                "distancia_km": 1.2
            }
        ]