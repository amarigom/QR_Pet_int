from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func

class Base(DeclarativeBase):
    """Clase base para todos los modelos de la aplicación"""
    
    # Definimos que todos los modelos tengan un ID autoincremental por defecto
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Campos de auditoría automáticos
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    #updated_at: Mapped[datetime] = mapped_column( server_default=func.now(), onupdate=func.now())