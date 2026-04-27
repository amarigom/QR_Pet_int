"""
Configuración de logging
"""
import logging
import sys
from app.config import settings

def setup_logger(name: str) -> logging.Logger:
    """Configura un logger con formato estándar"""
    logger = logging.getLogger(name)
    
    if settings.DEBUG:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


logger = setup_logger("app")
