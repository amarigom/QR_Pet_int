from sqlalchemy import CheckConstraint, Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


veterinario_clientes = Table(
    "veterinario_clientes",
    Base.metadata,
    Column(
        "veterinario_id",
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "cliente_id",
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    CheckConstraint("veterinario_id != cliente_id", name="ck_vet_cliente_distinct"),
)
