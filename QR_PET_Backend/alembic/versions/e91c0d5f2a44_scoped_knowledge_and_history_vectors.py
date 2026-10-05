"""Scope knowledge vectors and track clinical record indexing.

Revision ID: e91c0d5f2a44
Revises: d3f8a1c92b74
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e91c0d5f2a44"
down_revision: Union[str, Sequence[str], None] = "d3f8a1c92b74"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("knowledge_vectors", sa.Column("chunk_id", sa.String(length=255), nullable=True))
    op.execute("UPDATE knowledge_vectors SET chunk_id = doc_id WHERE chunk_id IS NULL")
    op.alter_column("knowledge_vectors", "chunk_id", nullable=False)
    op.create_index("ix_knowledge_vectors_chunk_id", "knowledge_vectors", ["chunk_id"])
    op.add_column(
        "knowledge_vectors",
        sa.Column("owner_type", sa.String(length=30), server_default="admin", nullable=False),
    )
    op.add_column(
        "knowledge_vectors",
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "knowledge_vectors",
        sa.Column("pet_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "knowledge_vectors",
        sa.Column("source_type", sa.String(length=30), server_default="document", nullable=False),
    )
    op.create_foreign_key(
        "fk_knowledge_vectors_owner_id_usuarios",
        "knowledge_vectors",
        "usuarios",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_knowledge_vectors_pet_id_mascotas",
        "knowledge_vectors",
        "mascotas",
        ["pet_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_knowledge_vectors_owner_type", "knowledge_vectors", ["owner_type"])
    op.create_index("ix_knowledge_vectors_owner_id", "knowledge_vectors", ["owner_id"])
    op.create_index("ix_knowledge_vectors_pet_id", "knowledge_vectors", ["pet_id"])
    op.add_column(
        "historias_clinicas",
        sa.Column("vectorizada", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("historias_clinicas", "vectorizada")
    op.drop_index("ix_knowledge_vectors_pet_id", table_name="knowledge_vectors")
    op.drop_index("ix_knowledge_vectors_owner_id", table_name="knowledge_vectors")
    op.drop_index("ix_knowledge_vectors_owner_type", table_name="knowledge_vectors")
    op.drop_constraint(
        "fk_knowledge_vectors_pet_id_mascotas", "knowledge_vectors", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_knowledge_vectors_owner_id_usuarios", "knowledge_vectors", type_="foreignkey"
    )
    op.drop_column("knowledge_vectors", "source_type")
    op.drop_column("knowledge_vectors", "pet_id")
    op.drop_column("knowledge_vectors", "owner_id")
    op.drop_column("knowledge_vectors", "owner_type")
    op.drop_index("ix_knowledge_vectors_chunk_id", table_name="knowledge_vectors")
    op.drop_column("knowledge_vectors", "chunk_id")
