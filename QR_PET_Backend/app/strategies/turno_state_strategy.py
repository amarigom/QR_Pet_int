# app/strategies/turno_state_strategy.py
from abc import ABC, abstractmethod
from fastapi import HTTPException, status
from app.models.turno import Turno, EstadoTurno

class EstadoTurnoStrategy(ABC):
    @abstractmethod
    def validar_transicion(self, turno: Turno) -> None:
        pass

class TransicionAAtendidoStrategy(EstadoTurnoStrategy):
    def validar_transicion(self, turno: Turno) -> None:
        if turno.estado == EstadoTurno.CANCELADO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede marcar como ATENDIDO un turno que fue cancelado."
            )

class TransicionACanceladoStrategy(EstadoTurnoStrategy):
    def validar_transicion(self, turno: Turno) -> None:
        if turno.estado == EstadoTurno.ATENDIDO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede cancelar un turno que ya fue ATENDIDO."
            )

class EstadoTurnoFactory:
    _strategies = {
        EstadoTurno.ATENDIDO: TransicionAAtendidoStrategy(),
        EstadoTurno.CANCELADO: TransicionACanceladoStrategy(),
    }

    @classmethod
    def obtener_estrategia(cls, nuevo_estado: EstadoTurno) -> EstadoTurnoStrategy:
        strategy = cls._strategies.get(nuevo_estado)
        if not strategy:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transición al estado {nuevo_estado} no válida."
            )
        return strategy