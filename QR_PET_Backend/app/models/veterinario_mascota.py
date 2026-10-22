from sqlalchemy import Column, DateTime, ForeignKey, Table, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


veterinario_mascotas = Table(
    "veterinario_mascotas",
    Base.metadata,
    Column(
        "veterinario_id",
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "mascota_id",
        UUID(as_uuid=True),
        ForeignKey("mascotas.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    UniqueConstraint("mascota_id", name="uq_veterinario_mascotas_mascota_id"),
)
