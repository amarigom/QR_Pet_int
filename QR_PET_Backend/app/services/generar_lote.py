import os
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# 🔌 Dependencias de tu arquitectura
from app.core.database import get_db
from app.models.qr import QRCode
from app.utils.qr_generator import generar_qr_medalla  # Tu generador físico en disco
from app.config import settings

async def generar_imagenes_por_lote(nombre_lote: str):
    """
    Busca en la DB los QRs del lote indicado y genera los .png locales para imprenta.
    """
    nombre_lote_limpio = nombre_lote.strip()
    
    async for session in get_db():
        try:
            print(f"\n🔍 Consultando la base de datos para el Lote: '{nombre_lote_limpio}'...")
            
            # Buscamos por la nueva columna que acabamos de crear
            query = select(QRCode).where(
                QRCode.lote == nombre_lote_limpio,
                QRCode.activo == True
            )
            result = await session.execute(query)
            qrs = list(result.scalars().all())
            
            if not qrs:
                print(f"No se encontraron códigos QR activos asignados al lote '{nombre_lote_limpio}'.")
                print(" Asegurate de que los códigos tengan este lote cargado en la base de datos.")
                return

            total = len(qrs)
            print(f"¡Lote detectado! Iniciando generación de {total} imágenes...")
            print("-" * 60)

            contador_exito = 0
            for index, qr in enumerate(qrs, start=1):
                try:
                    # Genera físicamente el archivo en tu carpeta static
                    ruta = generar_qr_medalla(id_mascota=qr.codigo)
                    print(f"[{index}/{total}] QR Creado: {qr.codigo} -> {ruta}")
                    contador_exito += 1
                except Exception as err_individual:
                    print(f"[{index}/{total}] Falló código {qr.codigo}: {err_individual}")

            print("-" * 60)
            print(f"¡Proceso terminado! Éxito: {contador_exito}/{total} archivos generados.")
            print(f"Carpeta de destino: {settings.STATIC_QR_DIR}")

        except Exception as e:
            print(f"Error crítico en la ejecución: {str(e)}")
        finally:
            await session.close()

if __name__ == "__main__":
    print("=" * 60)
    print("     GENERADOR LOCAL DE IMÁGENES QR POR LOTE       ")
    print("=" * 60)
    
    lote_input = input("Ingresá el identificador del lote (ej: LOTE-01): ").strip()
    
    if lote_input:
        asyncio.run(generar_imagenes_por_lote(lote_input))
    else:
        print("Operación cancelada: El nombre del lote no puede estar vacío.")