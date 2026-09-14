"""crear tablas modulo veterinaria

Revision ID: b197ca43c1b9
Revises: 4aa7480f5000
Create Date: 2026-09-13 12:31:47.654162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b197ca43c1b9'
down_revision: Union[str, Sequence[str], None] = '4aa7480f5000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tabla Perfiles Veterinarios
    op.create_table(
        'perfiles_veterinarios',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('nombre_clinica', sa.String(length=150), nullable=False),
        sa.Column('matricula', sa.String(length=50), nullable=False),
        sa.Column('especialidad', sa.String(length=100), nullable=True),
        sa.Column('direccion_consultorio', sa.String(length=255), nullable=True),
        sa.Column('telefono_agenda', sa.String(length=30), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('matricula'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_perfiles_veterinarios_matricula'), 'perfiles_veterinarios', ['matricula'], unique=True)
    op.create_index(op.f('ix_perfiles_veterinarios_user_id'), 'perfiles_veterinarios', ['user_id'], unique=True)

    # 2. Tabla Historias Clínicas
    op.create_table(
        'historias_clinicas',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('veterinario_id', sa.UUID(), nullable=False),
        sa.Column('mascota_id', sa.UUID(), nullable=False),
        sa.Column('fecha_consulta', sa.DateTime(), nullable=True),
        sa.Column('motivo_consulta', sa.String(length=255), nullable=False),
        sa.Column('diagnostico', sa.Text(), nullable=True),
        sa.Column('tratamiento', sa.Text(), nullable=True),
        sa.Column('peso_kg', sa.Float(), nullable=True),
        sa.Column('temperatura_c', sa.Float(), nullable=True),
        sa.Column('adjuntos', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['mascota_id'], ['pets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['veterinario_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_historias_clinicas_fecha_consulta'), 'historias_clinicas', ['fecha_consulta'], unique=False)
    op.create_index(op.f('ix_historias_clinicas_mascota_id'), 'historias_clinicas', ['mascota_id'], unique=False)
    op.create_index(op.f('ix_historias_clinicas_veterinario_id'), 'historias_clinicas', ['veterinario_id'], unique=False)

    # 3. Tabla Turnos
    op.create_table(
        'turnos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('veterinario_id', sa.UUID(), nullable=False),
        sa.Column('mascota_id', sa.UUID(), nullable=False),
        sa.Column('dueno_id', sa.UUID(), nullable=False),
        sa.Column('fecha_hora_inicio', sa.DateTime(), nullable=False),
        sa.Column('fecha_hora_fin', sa.DateTime(), nullable=False),
        sa.Column('estado', sa.String(length=30), nullable=False, server_default='PROGRAMADO'),
        sa.Column('tipo_servicio', sa.String(length=50), nullable=False),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('recordatorio_enviado', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['dueno_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['mascota_id'], ['pets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['veterinario_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_turnos_fecha_hora_inicio'), 'turnos', ['fecha_hora_inicio'], unique=False)
    op.create_index(op.f('ix_turnos_veterinario_id'), 'turnos', ['veterinario_id'], unique=False)


def downgrade() -> None:
    op.drop_table('turnos')
    op.drop_table('historias_clinicas')
    op.drop_table('perfiles_veterinarios')