from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

from app.api.v1.endpoints.conocimiento import _knowledge_scope
from app.repositories.knowledge_repository import KnowledgeRepository
from app.repositories.pet_vector_repository import PetVectorRepository
from app.services.historia_clinica_service import HistoriaClinicaService


class QueryResult:
    def __iter__(self):
        return iter([])


@pytest.mark.parametrize(
    ("role", "expected_scope", "expected_owner"),
    [
        ("admin", "admin", None),
        ("veterinario", "veterinarian", "owner"),
    ],
)
def test_knowledge_ingestion_scope_is_derived_from_authenticated_role(
    role, expected_scope, expected_owner
):
    user_id = uuid4()
    scope, owner_id = _knowledge_scope(SimpleNamespace(rol=role, id=user_id))

    assert scope == expected_scope
    assert owner_id == (user_id if expected_owner else None)


def test_knowledge_ingestion_rejects_regular_users():
    with pytest.raises(HTTPException) as error:
        _knowledge_scope(SimpleNamespace(rol="usuario", id=uuid4()))

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_knowledge_search_restricts_veterinarian_vectors_to_own_clinic():
    db = SimpleNamespace(execute=AsyncMock(return_value=QueryResult()))
    veterinarian_id = uuid4()

    await KnowledgeRepository(db).buscar_similares(
        query_vector=[0.1, 0.2],
        user_id=veterinarian_id,
        user_role="veterinario",
    )

    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "owner_type" in sql
    assert "owner_id" in sql
    assert " OR " in sql


@pytest.mark.asyncio
async def test_user_search_includes_only_documents_from_linked_veterinarians():
    db = SimpleNamespace(execute=AsyncMock(return_value=QueryResult()))

    await KnowledgeRepository(db).buscar_similares(
        query_vector=[0.1, 0.2],
        user_id=uuid4(),
        user_role="usuario",
    )

    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    where_clause = sql.split("WHERE", 1)[1]
    assert "owner_type" in where_clause
    assert "owner_id IN (SELECT veterinario_clientes.veterinario_id" in where_clause
    assert "veterinario_clientes.cliente_id" in where_clause
    assert "source_type" in where_clause
    assert " OR " in where_clause


@pytest.mark.asyncio
async def test_veterinarian_pet_search_is_limited_to_linked_clients():
    db = SimpleNamespace(execute=AsyncMock(return_value=QueryResult()))
    veterinarian_id = uuid4()

    await PetVectorRepository(db).search_similar_for_veterinarian(
        query_vector=[0.1, 0.2],
        veterinarian_id=veterinarian_id,
        limit=5,
    )

    sql = str(db.execute.await_args.args[0].compile(dialect=postgresql.dialect()))
    assert "veterinario_clientes" in sql
    assert "mascotas.usuario_id IN" in sql


@pytest.mark.asyncio
async def test_clinical_record_vector_uses_veterinarian_and_pet_scope():
    veterinarian_id = uuid4()
    pet_id = uuid4()
    record = SimpleNamespace(
        id=uuid4(),
        veterinario_id=veterinarian_id,
        mascota_id=pet_id,
        fecha_consulta=None,
        motivo_consulta="Control anual",
        diagnostico="Buen estado general",
        tratamiento="Vacuna",
        peso_kg=12.0,
        temperatura_c=38.5,
        vectorizada=False,
    )
    db = SimpleNamespace(commit=AsyncMock())
    vector_service = SimpleNamespace(ingestar_documento=AsyncMock(return_value=True))

    indexed = await HistoriaClinicaService(db, vector_service)._vectorize_record(record)

    assert indexed is True
    assert record.vectorizada is True
    assert db.commit.await_count == 1
    vector_service.ingestar_documento.assert_awaited_once()
    assert vector_service.ingestar_documento.await_args.kwargs["owner_type"] == "veterinarian"
    assert vector_service.ingestar_documento.await_args.kwargs["owner_id"] == veterinarian_id
    assert vector_service.ingestar_documento.await_args.kwargs["pet_id"] == pet_id
    assert vector_service.ingestar_documento.await_args.kwargs["source_type"] == "medical_record"


@pytest.mark.asyncio
async def test_document_listing_groups_chunks_by_title_and_owner_scope():
    document_row = SimpleNamespace(
        doc_id="first-chunk",
        titulo="Guía de uso",
        categoria="general",
        source_type="document",
        compartido=False,
    )
    db = SimpleNamespace(
        execute=AsyncMock(return_value=[document_row])
    )

    documents = await KnowledgeRepository(db).listar_documentos(
        user_id=uuid4(),
        user_role="veterinario",
    )

    statement = db.execute.await_args.args[0]
    sql = str(statement.compile(dialect=postgresql.dialect()))
    group_by = sql.split("GROUP BY", 1)[1].split("ORDER BY", 1)[0]
    assert "knowledge_vectors.titulo" in group_by
    assert "knowledge_vectors.owner_id" in group_by
    assert "knowledge_vectors.doc_id" not in group_by
    assert documents == [{
        "doc_id": "first-chunk",
        "titulo": "Guía de uso",
        "categoria": "general",
        "source_type": "document",
        "compartido": False,
    }]
