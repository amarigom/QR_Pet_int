from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.schemas.conocimiento import IngestaTextoInput, IngestaResponse
from app.services.chroma_service import VectorStoreService
from app.api.v1.dependencies import get_vector_store_service    
import pypdf
import docx
import io

router = APIRouter(prefix="/conocimiento", tags=["Base de Conocimiento"])

@router.post("/texto", response_model=IngestaResponse)
async def ingestar_texto_directo(
    data: IngestaTextoInput,
    v_service: VectorStoreService = Depends(get_vector_store_service)
):
    """
    Ingesta un texto plano directo a la base de conocimientos de ChromaDB.
    """
    try:
        # Llama a tu servicio para vectorizar y guardar en ChromaDB
        v_service.ingestar_documento(
            doc_id=data.doc_id,
            titulo=data.titulo,
            contenido=data.contenido,
            categoria=data.categoria
        )
        return IngestaResponse(
            status="success",
            message=f"Documento '{data.titulo}' vectorizado correctamente.",
            doc_id=data.doc_id,
            chunks_procesados=1
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al ingestar texto: {str(e)}")


@router.post("/archivo", response_model=IngestaResponse)
async def ingestar_archivo(
    doc_id: str = Form(...),
    titulo: str = Form(...),
    categoria: str = Form("general"),
    file: UploadFile = File(...),
    v_service: VectorStoreService = Depends(get_vector_store_service)
):
    """
    Recibe un archivo (.pdf, .docx, .txt), extrae su contenido y lo guarda en ChromaDB.
    """
    contenido_texto = ""
    file_bytes = await file.read()
    filename = file.filename.lower()

    try:
        # 1. Extracción de texto según formato
        if filename.endswith(".txt"):
            contenido_texto = file_bytes.decode("utf-8")

        elif filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                texto_pagina = page.extract_text()
                if texto_pagina:
                    contenido_texto += texto_pagina + "\n"

        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_bytes))
            contenido_texto = "\n".join([p.text for p in doc.paragraphs if p.text])

        else:
            raise HTTPException(
                status_code=400, 
                detail="Formato no soportado. Debe ser .pdf, .docx o .txt"
            )

        if not contenido_texto.strip():
            raise HTTPException(status_code=400, detail="El archivo está vacío o no se pudo extraer texto.")

        # 2. Vectorizar y guardar en ChromaDB
        v_service.ingestar_documento(
            doc_id=doc_id,
            titulo=titulo,
            contenido=contenido_texto,
            categoria=categoria
        )

        return IngestaResponse(
            status="success",
            message=f"Archivo '{file.filename}' procesado e ingresado a la base vectorial.",
            doc_id=doc_id,
            chunks_procesados=1
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")