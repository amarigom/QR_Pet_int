import io
import logging
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
import docx
import pypdf

from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.api.v1.dependencies import get_vector_store_service
from app.schemas.conocimiento import IngestaResponse, IngestaTextoInput
from app.services.pgvector_service import VectorStoreService

router = APIRouter(prefix="/conocimiento", tags=["Base de Conocimiento"])
logger = logging.getLogger("uvicorn.error")

# Splitter de LangChain: corta en bloques de ~800 caracteres con solapamiento
splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)


@router.post("/texto", response_model=IngestaResponse)
async def ingestar_texto_directo(
    data: IngestaTextoInput,
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    try:
        chunks = splitter.split_text(data.contenido)
        guardados = 0

        for i, chunk in enumerate(chunks):
            c_id = f"{data.doc_id}_chunk_{i}" if len(chunks) > 1 else data.doc_id
            
            exito = await v_service.ingestar_documento(
                chunk_id=c_id,
                doc_id=data.doc_id,
                titulo=data.titulo,
                contenido=chunk,
                categoria=data.categoria,
            )
            if exito:
                guardados += 1

        return IngestaResponse(
            status="success",
            message=f"Documento '{data.titulo}' guardado en Postgres.",
            doc_id=data.doc_id,
            chunks_procesados=guardados,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/archivo", response_model=IngestaResponse)
async def ingestar_archivo(
    doc_id: str = Form(...),
    titulo: str = Form(...),
    categoria: str = Form("general"),
    file: UploadFile = File(...),
    v_service: VectorStoreService = Depends(get_vector_store_service),
):
    file_bytes = await file.read()
    filename = file.filename.lower()
    texto = ""

    try:
        if filename.endswith(".txt"):
            texto = file_bytes.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            texto = "\n".join([p.extract_text() or "" for p in reader.pages])
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            texto = "\n".join([p.text for p in doc.paragraphs if p.text])
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado (.pdf, .docx, .txt)")

        if not texto.strip():
            raise HTTPException(status_code=400, detail="Archivo vacío.")

        chunks = splitter.split_text(texto)
        guardados = 0

        for i, chunk in enumerate(chunks):
            c_id = f"{doc_id}_chunk_{i}" if len(chunks) > 1 else doc_id
            exito = await v_service.ingestar_documento(
                chunk_id=c_id,
                doc_id=doc_id,
                titulo=titulo,
                contenido=chunk,
                categoria=categoria,
            )
            
            if exito:
                guardados += 1

        return IngestaResponse(
            status="success",
            message=f"Archivo '{file.filename}' guardado en Postgres.",
            doc_id=doc_id,
            chunks_procesados=guardados,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))