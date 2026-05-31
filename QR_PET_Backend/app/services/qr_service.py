import uuid
import io
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

# Importes de reportlab y qrcode para la compilación del PDF
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Image, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.repositories.qr_repository import QRRepository
from app.repositories.pet_repository import PetRepository
from app.core.auth import generate_qr_code
from app.core.exceptions import ResourceNotFoundException, InvalidDataException
from app.core.constants import MESSAGE_QR_NOT_FOUND, MESSAGE_QR_ALREADY_LINKED
from app.schemas.qr import QRResponse, QRActivateData
from app.schemas.composite import QRDetailResponse
from app.config import settings  

# Importamos la herramienta de renderizado físico de imágenes QR
from app.utils.qr_generator import generar_qr_medalla


class QRService:
    """Service para gestionar el ciclo de vida de los códigos QR"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.qr_repo = QRRepository(db)
        self.pet_repo = PetRepository(db)
    
    async def generate_qrs(self, cantidad: int, lote: str, admin_user: dict) -> Dict[str, Any]:
        """Genera múltiples QRs en lote (Batch operation) y exporta sus PNGs físicos"""
        created_qrs = []
        
        for _ in range(cantidad):
            codigo = generate_qr_code()
            # pasamos el parámetro 'lote' al repositorio
            qr = await self.qr_repo.create(codigo=codigo, lote=lote, activo=True)
            created_qrs.append(qr)
        
        await self.db.commit()
                
        for q in created_qrs:
            try:
                generar_qr_medalla(id_mascota=q.codigo)
            except Exception as e:
                print(f"Error al escribir imagen física para el código QR {q.codigo}: {e}")
        
        return {
            "lote": lote,  # Reportamos el lote procesado en la respuesta HTTP
            "created": len(created_qrs),
            "qrs": [QRResponse.model_validate(q) for q in created_qrs],
        }

    async def export_lote_to_pdf(self, lote: str) -> StreamingResponse:
        """
        Busca todos los QR pertenecientes a un lote específico y genera 
        una plantilla A4 en PDF con una grilla de 3 columnas para imprenta.
        """
        # 1. Buscamos todas las placas que pertenezcan a ese lote
        qrs_del_lote = await self.qr_repo.get_by_lote(lote) # Asegurate de tener este método en tu QRRepository
        
        if not qrs_del_lote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontraron códigos QR asociados al lote '{lote}'"
            )
            
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4, 
                leftMargin=30, 
                rightMargin=30, 
                topMargin=30, 
                bottomMargin=30
            )
            
            styles = getSampleStyleSheet()
            story = []
            
            titulo_style = ParagraphStyle(
                'TituloLote', 
                parent=styles['Heading1'], 
                fontSize=18, 
                leading=22, 
                textColor=colors.HexColor('#1e3a8a')
            )
            meta_style = ParagraphStyle(
                'MetaLote', 
                parent=styles['Normal'], 
                fontSize=9, 
                textColor=colors.HexColor('#64748b')
            )
            
            story.append(Paragraph("Plantilla de Producción - Medallas QR", titulo_style))
            story.append(Paragraph(f"Identificador de Lote: <b>{lote}</b> | Cantidad: {len(qrs_del_lote)} unidades | Tolerancia: Alta (H)", meta_style))
            story.append(Spacer(1, 20))
            
            tabla_datos = []
            fila_actual = []
            
            # Sanitizamos la URL base leyendo tus settings corporativos de producción/desarrollo
            base_limpia = settings.FRONTEND_URL.rstrip('/')
            url_base = f"{base_limpia}/scan/"
            
            for index, qr_db in enumerate(qrs_del_lote):
                # Construimos el QR con corrección tipo H (soporta raspaduras y suciedad de calle)
                qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=1)
                qr.add_data(f"{url_base}{qr_db.codigo}")
                qr.make(fit=True)
                
                img_buffer = io.BytesIO()
                img_pure = qr.make_image(fill_color="black", back_color="white")
                img_pure.save(img_buffer, format="PNG")
                img_buffer.seek(0)
                
                img_pdf = Image(img_buffer, width=110, height=110)
                
                # Metadata visual inferior para facilitar el corte y control del operador gráfico
                info_medalla = f"<font face='Courier' size='10'><b>{qr_db.codigo}</b></font><br/><font size='7' color='#94a3b8'>✂️ LÍNEA DE CORTE</font>"
                p_info = Paragraph(info_medalla, styles['Normal'])
                
                celda_contenedor = [img_pdf, Spacer(1, 4), p_info]
                fila_actual.append(celda_contenedor)
                
                # Agrupamos en filas simétricas de 3 columnas
                if (index + 1) % 3 == 0 or (index + 1) == len(qrs_del_lote):
                    while len(fila_actual) < 3:
                        fila_actual.append("")
                    tabla_datos.append(fila_actual)
                    fila_actual = []
            
            grilla_tabla = Table(tabla_datos, colWidths=[175, 175, 175])
            grilla_tabla.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('BOTTOMPADDING', (0,0), (-1,-1), 12),
                ('TOPPADDING', (0,0), (-1,-1), 12),
            ]))
            
            story.append(grilla_tabla)
            doc.build(story)
            buffer.seek(0)
            
            return StreamingResponse(
                buffer, 
                media_type="application/pdf", 
                headers={"Content-Disposition": f"attachment; filename=plantilla_lote_{lote}.pdf"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al compilar el PDF del lote: {str(e)}")
    
    async def get_qr(self, qr_id: uuid.UUID) -> QRDetailResponse:
        """Obtiene detalles de un QR usando el objeto modelo"""
        qr = await self.qr_repo.get_by_id(qr_id)
        if not qr:
            raise ResourceNotFoundException("Código QR")
        
        return QRDetailResponse.model_validate(qr)
    
    async def get_all_qrs(self, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Listado administrative de QRs con información de mascota y dueño"""
        offset = (page - 1) * limit
        qrs = await self.qr_repo.get_all_with_details(limit, offset)
        total = await self.qr_repo.count()
        
        return {
            "items": [QRDetailResponse.model_validate(q) for q in qrs],
            "total": total,
            "page": page,
            "limit": limit,
        }
    
    async def check_qr_availability(self, codigo: str) -> Dict[str, Any]:
        """Verifica disponibilidad sin lanzar excepciones (para el frontend)"""
        qr = await self.qr_repo.get_by_code(codigo)
        
        if not qr:
            return {"available": False, "message": "Código no encontrado"}
        
        if qr.mascota_id:
            return {
                "available": False, 
                "message": "Ya está vinculado a una mascota",
                "has_pet": True
            }
        
        return {"available": True, "message": "Disponible para activar"}
    
    async def activate_qr(self, user_id: uuid.UUID, activate_data: QRActivateData) -> Dict[str, Any]:
        """
        Operación Atómica: Crea mascota + Vincula QR.
        Si algo falla, no se guarda nada.
        """
        # 1. Validar el código QR
        qr = await self.qr_repo.get_by_code(activate_data.codigo)
        if not qr:
            raise ResourceNotFoundException("Código QR", MESSAGE_QR_NOT_FOUND)
        
        if qr.mascota_id:
            raise InvalidDataException(MESSAGE_QR_ALREADY_LINKED)
        
        # 2. Crear mascota (Usamos model_dump para mapear el schema al modelo)
        pet = await self.pet_repo.create(
            usuario_id=user_id,
            **activate_data.model_dump(exclude={"codigo"})
        )
        
        # 3. Vincular (Aquí simplemente actualizamos el objeto en la sesión)
        qr.mascota_id = pet.id
        
        # 4. COMMIT ÚNICO: Aquí se guarda la mascota y la actualización del QR
        await self.db.commit()
        await self.db.refresh(pet)
        
        return {
            "message": "QR activado correctamente",
            "pet_id": str(pet.id),
            "qr_id": str(qr.id),
        }
    
    async def delete_qr(self, qr_id: uuid.UUID) -> bool:
        """Elimina un QR y confirma la transacción"""
        success = await self.qr_repo.delete(qr_id)
        if not success:
            raise ResourceNotFoundException("Código QR")
        
        await self.db.commit()
        return True    
    
    async def activar_desactivar_qr(self, codigo: str):
        # 1. El Servicio solicita al repositorio que busque el QR
        qr = await self.qr_repo.get_by_code(codigo)
        
        if not qr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró la placa con código {codigo.upper()}"
            )
                
        nuevo_estado = not qr.activo
        
        # 3. El Servicio le solicita formalmente al repositorio que guarde el nuevo estado
        resultado = await self.qr_repo.update_status(db_qr=qr, activo=nuevo_estado)
        
        # 4. Confirmamos la transacción en la sesión asíncrona
        await self.db.commit()
        
        return resultado