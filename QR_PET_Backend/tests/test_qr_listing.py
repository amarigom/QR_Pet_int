from unittest.mock import AsyncMock
from types import SimpleNamespace

import pytest
from sqlalchemy.dialects import postgresql

from app.repositories.qr_repository import QRRepository


def test_admin_qr_list_supports_search_across_qr_lot_pet_and_owner():
    statement = QRRepository(AsyncMock())._list_query(
        search="Luna",
        assignment="assigned",
    )
    sql = str(statement.compile(dialect=postgresql.dialect())).lower()

    assert "left outer join mascotas" in sql
    assert "left outer join usuarios" in sql
    assert "codigos_qr.codigo ilike" in sql
    assert "codigos_qr.lote ilike" in sql
    assert "mascotas.nombre ilike" in sql
    assert "usuarios.nombre ilike" in sql
    assert "usuarios.email ilike" in sql
    assert "codigos_qr.mascota_id is not null" in sql


@pytest.mark.asyncio
async def test_admin_qr_filtered_count_is_distinct():
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(scalar=lambda: 3)
    repository = QRRepository(db)

    total = await repository.count_filtered("Luna", "assigned")

    statement = db.execute.await_args.args[0]
    sql = str(statement.compile(dialect=postgresql.dialect())).lower()
    assert total == 3
    assert "count(distinct(codigos_qr.id))" in sql
