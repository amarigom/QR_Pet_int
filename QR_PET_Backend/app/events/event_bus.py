"""
Event Bus - Patrón Event-Driven
Evita dependencias circulares entre servicios
Permite que servicios se comuniquen de manera desacoplada
"""
from typing import Callable, Dict, Type, List
import asyncio


class Event:
    """Clase base para todos los eventos"""
    pass


class EventBus:
    """
    Event Bus global
    Maneja publicación y suscripción de eventos
    Evita dependencias circulares
    """
    
    # Mapeo de tipo de evento -> lista de handlers
    _handlers: Dict[Type[Event], List[Callable]] = {}
    
    @classmethod
    def subscribe(cls, event_type: Type[Event], handler: Callable) -> None:
        """
        Suscribir a un tipo de evento
        
        Ejemplo:
            def on_pet_registered(event: PetRegisteredEvent):
                # hacer algo
            
            EventBus.subscribe(PetRegisteredEvent, on_pet_registered)
        """
        if event_type not in cls._handlers:
            cls._handlers[event_type] = []
        
        cls._handlers[event_type].append(handler)
    
    @classmethod
    async def publish(cls, event: Event) -> None:
        """
        Publicar un evento
        Ejecuta todos los handlers suscritos de forma asincrónica
        
        Ejemplo:
            await EventBus.publish(PetRegisteredEvent(pet_id, owner_id))
        """
        event_type = type(event)
        
        if event_type not in cls._handlers:
            return  # No hay handlers para este evento
        
        handlers = cls._handlers[event_type]
        
        # Ejecutar todos los handlers en paralelo
        tasks = [handler(event) for handler in handlers]
        await asyncio.gather(*tasks)
    
    @classmethod
    def unsubscribe(cls, event_type: Type[Event], handler: Callable) -> None:
        """Desuscribir de un tipo de evento"""
        if event_type in cls._handlers:
            cls._handlers[event_type] = [
                h for h in cls._handlers[event_type] if h != handler
            ]
    
    @classmethod
    def clear(cls) -> None:
        """Limpiar todos los handlers (útil para testing)"""
        cls._handlers = {}
    
    @classmethod
    def get_handlers(cls, event_type: Type[Event]) -> List[Callable]:
        """Obtener handlers para un evento (útil para debugging)"""
        return cls._handlers.get(event_type, [])


# Eventos del dominio veterinario
# Importados desde factories
