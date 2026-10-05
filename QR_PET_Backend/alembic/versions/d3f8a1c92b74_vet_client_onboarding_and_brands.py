"""Add veterinarian client links, activation and clinic logos.

Revision ID: d3f8a1c92b74
Revises: c18c9a4d2e31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3f8a1c92b74"
down_revision: Union[str, Sequence[str], None] = "c18c9a4d2e31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column(
            "pending_activation",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "usuarios",
        sa.Column("activation_token_hash", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "usuarios",
        sa.Column("activation_token_expires_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_usuarios_activation_token_hash",
        "usuarios",
        ["activation_token_hash"],
        unique=True,
    )
    op.add_column(
        "perfiles_veterinarios",
        sa.Column("logo_url", sa.String(length=500), nullable=True),
    )
    op.create_table(
        "veterinario_clientes",
        sa.Column("veterinario_id", sa.UUID(), nullable=False),
        sa.Column("cliente_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["cliente_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["veterinario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("veterinario_id", "cliente_id"),
        sa.CheckConstraint("veterinario_id != cliente_id", name="ck_vet_cliente_distinct"),
    )

    op.execute(
        """
        INSERT INTO veterinario_clientes (veterinario_id, cliente_id)
        SELECT DISTINCT turnos.veterinario_id, turnos.dueno_id
        FROM turnos
        WHERE turnos.dueno_id IS NOT NULL
        UNION
        SELECT DISTINCT historias_clinicas.veterinario_id, mascotas.usuario_id
        FROM historias_clinicas
        JOIN mascotas ON mascotas.id = historias_clinicas.mascota_id
        """
    )


def downgrade() -> None:
    op.drop_table("veterinario_clientes")
    op.drop_column("perfiles_veterinarios", "logo_url")
    op.drop_index("ix_usuarios_activation_token_hash", table_name="usuarios")
    op.drop_column("usuarios", "activation_token_expires_at")
    op.drop_column("usuarios", "activation_token_hash")
    op.drop_column("usuarios", "pending_activation")
