"""
Funciones auxiliares generales
"""
from typing import Dict, Any, Optional


def convert_uuid_to_str(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte UUIDs a strings en un diccionario"""
    if data is None:
        return None
    
    converted = dict(data)
    for key, value in converted.items():
        if hasattr(value, 'hex'):  # UUID
            converted[key] = str(value)
    return converted


def format_timestamp(timestamp) -> str:
    """Formatea un timestamp a ISO format"""
    if hasattr(timestamp, 'isoformat'):
        return timestamp.isoformat()
    return str(timestamp)


def build_response(success: bool, data: Optional[Any] = None, message: str = "") -> Dict[str, Any]:
    """Construye una respuesta estándar"""
    return {
        "success": success,
        "data": data,
        "message": message,
    }


def paginate(items: list, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """Pagina una lista de items"""
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }
