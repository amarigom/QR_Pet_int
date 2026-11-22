"""crear tabla estudios_clinicos

Revision ID: e318c887c7dd
Revises: f2c4a8d6b901
Create Date: 2026-11-19 21:26:37.494800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e318c887c7dd'
down_revision: Union[str, Sequence[str], None] = 'f2c4a8d6b901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'estudios_clinicos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('mascota_id', sa.UUID(), nullable=False),
        sa.Column('titulo', sa.String(length=150), nullable=False),
        sa.Column('categoria', sa.String(length=50), nullable=False),
        sa.Column('tipo_archivo', sa.String(length=20), nullable=False),
        sa.Column('file_key', sa.String(length=255), nullable=False),
        sa.Column('tamano_bytes', sa.Integer(), nullable=True),
        sa.Column('notas_veterinario', sa.Text(), nullable=True),
        sa.Column('fecha_estudio', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['mascota_id'], ['mascotas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_estudios_clinicos_mascota_id'),
        'estudios_clinicos',
        ['mascota_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_estudios_clinicos_mascota_id'), table_name='estudios_clinicos')
    op.drop_table('estudios_clinicos')