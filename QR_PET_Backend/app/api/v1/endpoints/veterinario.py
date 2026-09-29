# app/api/v1/endpoints/veterinario.py
"""
Endpoints para operaciones específicas del veterinario.
Incluye: turnos, historias clínicas, carga de conocimiento, gestión de QRs.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_veterinario, require_veterinario_o_usuario
from app.models.user import User
from app.schemas.turno import TurnoCreate, TurnoResponse, TurnoUpdateEstado
from app.schemas.historia_clinica import HistoriaClinicaCreate, HistoriaClinicaResponse
from app.schemas.qr import QRAssignResponse
from app.schemas.conocimiento import IngestaResponse, PreguntaInput
from app.services.turno_service import TurnoService
from app.services.historia_clinica_service import HistoriaClinicaService
from app.services.qr_service import QRService
from app.services.pgvector_service import VectorStoreService
from app.api.v1.dependencies import get_vector_store_service

router = APIRouter(prefix="/veterinario", tags=["Veterinario"])


# ===== TURNO ENDPOINTS =====
@router.post("/turnos", response_model=TurnoResponse, status_code=status.HTTP_201_CREATED)
async def agendar_turno(
    data: TurnoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Agenda un turno (solo veterinario)."""
    service = TurnoService(db)
    return await service.agendar_turno(data, current_user)


@router.get("/turnos/agenda", response_model=List[TurnoResponse])
async def obtener_agenda(
    fecha: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Obtiene la agenda del veterinario para una fecha."""
    from datetime import datetime
    service = TurnoService(db)
    
    if fecha:
        fecha_obj = datetime.fromisoformat(fecha).date()
    else:
        fecha_obj = datetime.now().date()
    
    return await service.obtener_agenda_dia(fecha_obj, current_user.id)


@router.patch("/turnos/{turno_id}/estado", response_model=TurnoResponse)
async def actualizar_estado_turno(
    turno_id: uuid.UUID,
    payload: TurnoUpdateEstado,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Cambia el estado de un turno."""
    service = TurnoService(db)
    return await service.cambiar_estado_turno(turno_id, payload)


# ===== HISTORIA CLÍNICA ENDPOINTS =====
@router.post("/historias-clinicas", response_model=HistoriaClinicaResponse, status_code=status.HTTP_201_CREATED)
async def crear_historia_clinica(
    data: HistoriaClinicaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Crea una historia clínica para una mascota."""
    service = HistoriaClinicaService(db)
    return await service.crear_historia_clinica(data, current_user.id)


@router.get("/historias-clinicas", response_model=List[HistoriaClinicaResponse])
async def listar_historias(
    mascota_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Lista historias clínicas del veterinario."""
    service = HistoriaClinicaService(db)
    
    if mascota_id:
        return await service.obtener_por_mascota(mascota_id)
    return await service.obtener_del_veterinario(current_user.id)


@router.get("/historias-clinicas/{historia_id}", response_model=HistoriaClinicaResponse)
async def obtener_historia(
    historia_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Obtiene los detalles de una historia clínica."""
    service = HistoriaClinicaService(db)
    historia = await service.obtener_por_id(historia_id)
    
    if not historia or historia.veterinario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    
    return historia


# ===== CONOCIMIENTO ENDPOINTS (CARGA) =====
@router.post("/conocimiento/archivo", response_model=IngestaResponse)
async def cargar_conocimiento_archivo(
    doc_id: str = Form(...),
    titulo: str = Form(...),
    categoria: str = Form("general"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario),
    v_service: VectorStoreService = Depends(get_vector_store_service)
):
    """Carga un documento a la base de conocimiento (solo veterinario)."""
    import io
    import docx
    import pypdf
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
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
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
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
                usuario_id=str(current_user.id)  # 🔐 Inyectamos el usuario
            )
            if exito:
                guardados += 1
        
        return IngestaResponse(
            status="success",
            message=f"Documento '{file.filename}' guardado en base de conocimiento.",
            doc_id=doc_id,
            chunks_procesados=guardados,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conocimiento/texto", response_model=IngestaResponse)
async def cargar_conocimiento_texto(
    doc_id: str = Form(...),
    titulo: str = Form(...),
    contenido: str = Form(...),
    categoria: str = Form("general"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario),
    v_service: VectorStoreService = Depends(get_vector_store_service)
):
    """Carga texto directo a la base de conocimiento."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    try:
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
        chunks = splitter.split_text(contenido)
        guardados = 0
        
        for i, chunk in enumerate(chunks):
            c_id = f"{doc_id}_chunk_{i}" if len(chunks) > 1 else doc_id
            exito = await v_service.ingestar_documento(
                chunk_id=c_id,
                doc_id=doc_id,
                titulo=titulo,
                contenido=chunk,
                categoria=categoria,
                usuario_id=str(current_user.id)  # 🔐 Inyectamos el usuario
            )
            if exito:
                guardados += 1
        
        return IngestaResponse(
            status="success",
            message=f"Documento '{titulo}' guardado en base de conocimiento.",
            doc_id=doc_id,
            chunks_procesados=guardados,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== CHATBOT ENDPOINT (Accesible a veterinario y usuario común) =====
@router.post("/chatbot/preguntar")
async def consultar_chatbot(
    data: PreguntaInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario_o_usuario),
    v_service: VectorStoreService = Depends(get_vector_store_service)
):
    """
    Responde preguntas usando la base de conocimiento.
    🔐 Filtrada por usuario: solo verá documentos cargados por su veterinario.
    """
    try:
        # ✨ El servicio filtra automáticamente por usuario_id en la búsqueda
        resultado = await v_service.responder_con_rag(
            pregunta=data.pregunta,
            historial=data.historial,
            categoria=data.categoria,
            limit=data.limit,
            usuario_id=str(current_user.id) if current_user.rol == "usuario" else None
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== QR ASSIGNMENT ENDPOINTS =====
@router.get("/qr/asignados")
async def obtener_qrs_asignados(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Obtiene los QRs asignados al veterinario."""
    service = QRService(db)
    return await service.obtener_qrs_del_veterinario(current_user.id)


@router.post("/qr/{qr_id}/vincular-mascota", response_model=QRAssignResponse)
async def vincular_qr_mascota(
    qr_id: uuid.UUID,
    mascota_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_veterinario)
):
    """Vincula un QR a una mascota."""
    service = QRService(db)
    return await service.vincular_qr_mascota(qr_id, mascota_id, current_user.id)
