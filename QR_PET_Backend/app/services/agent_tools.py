import math
from typing import Dict, List, Any

def calcular_distancia(lat1: float, lon1: float, lat2: float, lon2: float) -> Dict[str, float]:
    """Calcula la distancia geodésica en km entre dos puntos."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return {"distancia_km": round(R * c, 2)}

#-- ESTO LO VA A HACER SOBRE UNA BASE DE DATOS, PERO POR AHORA LO HAGO ESTÁTICO... 

def obtener_veterinarias_db() -> List[Dict[str, Any]]:
    """Devuelve el listado de veterinarias cargadas en la BD."""
    return [
        {"nombre": "Veterinaria Central", "lat": -37.3288, "lng": -59.1370, "de_turno": True},
        {"nombre": "Veterinaria Serrano", "lat": -37.3210, "lng": -59.1310, "de_turno": False},
    ]

AVAILABLE_TOOLS = {
    "calcular_distancia": calcular_distancia,
    "obtener_veterinarias_db": obtener_veterinarias_db
}

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "obtener_veterinarias_db",
            "description": "Obtiene la lista de veterinarias con sus coordenadas y estado de turno.",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calcular_distancia",
            "description": "Calcula la distancia en kilómetros entre dos pares de coordenadas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lat1": {"type": "number", "description": "Latitud origen"},
                    "lon1": {"type": "number", "description": "Longitud origen"},
                    "lat2": {"type": "number", "description": "Latitud destino"},
                    "lon2": {"type": "number", "description": "Longitud destino"}
                },
                "required": ["lat1", "lon1", "lat2", "lon2"]
            }
        }
    }
]