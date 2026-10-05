"""Add explicit WhatsApp reminder consent to users.

Revision ID: c18c9a4d2e31
Revises: b197ca43c1b9
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c18c9a4d2e31"
down_revision: Union[str, Sequence[str], None] = "b197ca43c1b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column(
            "whatsapp_recordatorios_consent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("usuarios", "whatsapp_recordatorios_consent")
