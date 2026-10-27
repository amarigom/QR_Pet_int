"""Link existing pets to veterinarian clinics.

Revision ID: f2c4a8d6b901
Revises: e91c0d5f2a44
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f2c4a8d6b901"
down_revision: Union[str, Sequence[str], None] = "e91c0d5f2a44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "veterinario_mascotas",
        sa.Column("veterinario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mascota_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["mascota_id"], ["mascotas.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["veterinario_id"], ["usuarios.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("veterinario_id", "mascota_id"),
        sa.UniqueConstraint(
            "mascota_id", name="uq_veterinario_mascotas_mascota_id"
        ),
    )
    op.create_index(
        "ix_veterinario_mascotas_mascota_id",
        "veterinario_mascotas",
        ["mascota_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_veterinario_mascotas_mascota_id",
        table_name="veterinario_mascotas",
    )
    op.drop_table("veterinario_mascotas")
