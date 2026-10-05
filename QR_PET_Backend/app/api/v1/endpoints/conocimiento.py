import io
import logging
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from typing import Any
import docx
import pypdf
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.api.v1.dependencies import get_current_user, get_vector_store_service
from app.core.constants import UserRole
from app.models.user import User
from app.schemas.conocimiento import (
    DocumentoConocimientoResponse,
    IngestaResponse,
    IngestaTextoInput,
    PreguntaInput,
)
from app.services.pgvector_service import VectorStoreService

router = APIRouter(tags=["Base de Conocimiento"])
logger = logging.getLogger("uvicorn.error")
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_EXTRACTED_CHARACTERS = 300_000

# Splitter de LangChain: corta en bloques de ~800 caracteres con solapamiento
splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)


def _knowledge_scope(user: User) -> tuple[str, uuid.UUID | None]:
    if user.rol == UserRole.ADMIN:
        return "admin", None
    if user.rol == UserRole.VETERINARIO:
        return "veterinarian", user.id
    raise HTTPException(status_code=403, detail="No tenés permisos para gestionar conocimiento.")

async def _ingest_text(
    *,
    doc_id: str,
    titulo: str,
    contenido: str,
    categoria: str,
    owner_type: str,
    owner_id: uuid.UUID | None,
    v_service: VectorStoreService,
    source_type: str = "document",
) -> int:
    chunks = splitter.split_text(contenido)
    if not chunks:
        raise HTTPException(status_code=400, detail="No se encontró texto para vectorizar.")
    guardados = 0
    for i, chunk in enumerate(chunks):
        chunk_id = f"{doc_id}_chunk_{i}" if len(chunks) > 1 else doc_id
        if await v_service.ingestar_documento(
            chunk_id=chunk_id,
            doc_id=doc_id,
            titulo=titulo,
            contenido=chunk,
            categoria=categoria,
            owner_type=owner_type,
            owner_id=owner_id,
            source_type=source_type,
        ):
            guardados += 1
    if guardados != len(chunks):
        raise HTTPException(
            status_code=503,
            detail=f"Se vectorizaron {guardados} de {len(chunks)} fragmentos. "
            f"El documento {doc_id} requiere reintentar la carga.",
        )
    return guardados

@router.post("/texto", response_model=IngestaResponse)
async def ingestar_texto_directo(
    data: IngestaTextoInput,
    current_user: User = Depends(get_current_user),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    try:
        owner_type, owner_id = _knowledge_scope(current_user)
        guardados = await _ingest_text(
            doc_id=data.doc_id,
            titulo=data.titulo,
            contenido=data.contenido,
            categoria=data.categoria,
            owner_type=owner_type,
            owner_id=owner_id,
            v_service=v_service,
        )
        return IngestaResponse(
            status="success",
            message=f"Documento '{data.titulo}' vectorizado y guardado.",
            doc_id=data.doc_id,
            chunks_procesados=guardados,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error al vectorizar texto de conocimiento.")
        raise HTTPException(status_code=500, detail="No se pudo vectorizar el texto.") from e


@router.get("/documentos", response_model=list[DocumentoConocimientoResponse])
async def listar_documentos(
    current_user: User = Depends(get_current_user),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    if current_user.rol not in (UserRole.ADMIN, UserRole.VETERINARIO):
        raise HTTPException(status_code=403, detail="No tenés permisos para consultar documentos.")
    return await v_service.knowledge_repo.listar_documentos(current_user.id, current_user.rol)

@router.post("/archivo", response_model=IngestaResponse)
async def ingestar_archivo(
    doc_id: str = Form(..., min_length=1, max_length=200),
    titulo: str = Form(..., min_length=1, max_length=255),
    categoria: str = Form("general"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    try:
        owner_type, owner_id = _knowledge_scope(current_user)
        file_bytes = await file.read(MAX_FILE_BYTES + 1)
        if len(file_bytes) > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail="El archivo no puede superar los 10 MB.")
        filename = (file.filename or "").lower()
        if filename.endswith(".txt"):
            texto = file_bytes.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            texto = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [paragraph.text for paragraph in doc.paragraphs if paragraph.text]
            table_rows = [
                " | ".join(cell.text for cell in row.cells)
                for table in doc.tables
                for row in table.rows
            ]
            texto = "\n".join(paragraphs + table_rows)
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado (.pdf, .docx, .txt)")

        if not texto.strip():
            raise HTTPException(status_code=400, detail="Archivo vacío.")
        if len(texto) > MAX_EXTRACTED_CHARACTERS:
            raise HTTPException(
                status_code=413,
                detail=f"El texto extraído supera el límite de {MAX_EXTRACTED_CHARACTERS} caracteres.",
            )
        guardados = await _ingest_text(
            doc_id=doc_id,
            titulo=titulo,
            contenido=texto,
            categoria=categoria,
            owner_type=owner_type,
            owner_id=owner_id,
            v_service=v_service,
        )
        return IngestaResponse(
            status="success",
            message=f"Archivo '{file.filename}' vectorizado y guardado.",
            doc_id=doc_id,
            chunks_procesados=guardados,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error al procesar archivo de conocimiento.")
        raise HTTPException(status_code=400, detail="No se pudo extraer texto del archivo.") from e

@router.post("/responder")
async def responder_pregunta(
    data: PreguntaInput,
    current_user: User = Depends(get_current_user),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    if current_user.rol not in (UserRole.ADMIN, UserRole.USER, UserRole.VETERINARIO):
        raise HTTPException(status_code=403, detail="No tenés permisos para usar el asistente.")
    try:
        resultado = await v_service.responder_con_rag(
            pregunta=data.pregunta,
            user_id=current_user.id,
            user_role=current_user.rol,
            historial=data.historial,
            categoria=data.categoria,
            limit=data.limit,
        )
        return resultado
    except Exception as e:
        logger.exception("Error al responder la pregunta del asistente.")
        raise HTTPException(status_code=503, detail="No se pudo consultar el asistente en este momento.") from e