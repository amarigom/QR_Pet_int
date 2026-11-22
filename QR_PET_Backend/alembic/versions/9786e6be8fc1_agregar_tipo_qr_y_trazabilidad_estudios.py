"""agregar_tipo_qr_y_trazabilidad_estudios

Revision ID: 9786e6be8fc1
Revises: e318c887c7dd
Create Date: 2026-11-22 19:08:31.470686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9786e6be8fc1'
down_revision: Union[str, Sequence[str], None] = 'e318c887c7dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'codigos_qr',
        sa.Column(
            'tipo',
            sa.String(length=20),
            server_default='FISICO',
            nullable=False,
        ),
    )
    op.create_index(op.f('ix_codigos_qr_tipo'), 'codigos_qr', ['tipo'], unique=False)

    op.add_column(
        'estudios_clinicos',
        sa.Column('veterinario_id', sa.UUID(), nullable=True),
    )
    op.add_column(
        'estudios_clinicos',
        sa.Column('solicitado_por', sa.String(length=120), nullable=True),
    )
    op.create_index(
        op.f('ix_estudios_clinicos_veterinario_id'),
        'estudios_clinicos',
        ['veterinario_id'],
        unique=False,
    )
    op.create_foreign_key(
        'fk_estudios_clinicos_veterinario_id_usuarios',
        'estudios_clinicos',
        'usuarios',
        ['veterinario_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'fk_estudios_clinicos_veterinario_id_usuarios',
        'estudios_clinicos',
        type_='foreignkey',
    )
    op.drop_index(
        op.f('ix_estudios_clinicos_veterinario_id'),
        table_name='estudios_clinicos',
    )
    op.drop_column('estudios_clinicos', 'solicitado_por')
    op.drop_column('estudios_clinicos', 'veterinario_id')

    op.drop_index(op.f('ix_codigos_qr_tipo'), table_name='codigos_qr')
    op.drop_column('codigos_qr', 'tipo')