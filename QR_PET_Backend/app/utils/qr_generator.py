import io
import os
from pathlib import Path
import qrcode
from fastapi import HTTPException
from app.config import settings  

# --- CONFIGURACIÓN CORE DEL QR ---
def _configurar_objeto_qr(id_mascota: str, url_base: str = None) -> qrcode.QRCode:
    """
    Función interna para estructurar la URL y configurar el QR con alta tolerancia (ERROR_CORRECT_H).
    Evita repetir código en la versión de memoria y de archivo.
    """
    if url_base is None:
        base_limpia = settings.FRONTEND_URL.rstrip('/')
        url_base = f"{base_limpia}/scans/"

    url_final = f"https://qr-pet-int.vercel.app/scans/{id_mascota}"
    
    qr = qrcode.QRCode(
        version=None,                                      # Permite que el tamaño se adapte automáticamente al texto
        error_correction=qrcode.constants.ERROR_CORRECT_H, # Alta tolerancia para medallas de calle
        box_size=10,                                       # Tamaño de los píxeles del QR
        border=4,                                          # Margen blanco reglamentario
    )
    qr.add_data(url_final)
    qr.make(fit=True)
    return qr


# --- LÓGICA A: AL VUELO / MEMORIA (Para los endpoints de Vercel) ---
def generar_qr_memoria(id_mascota: str) -> io.BytesIO:
    """
    Genera el código QR y devuelve los bytes en memoria RAM (BytesIO)
    sin escribir absolutamente nada en el disco físico de Vercel.
    """
    try:
        qr = _configurar_objeto_qr(id_mascota)
        imagen_qr = qr.make_image(fill_color="black", back_color="white")
        
        buffer_ram = io.BytesIO()
        imagen_qr.save(buffer_ram, format="PNG")
        buffer_ram.seek(0) # Volvemos al inicio del archivo virtual
        return buffer_ram
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en generación por memoria: {str(e)}")


# --- LÓGICA B: EN DISCO (Para ejecuciones locales e imprenta) ---
def generar_qr_medalla(id_mascota: str, url_base: str = None) -> str:
    """
    Genera un código QR con alta tolerancia a fallos
    y lo guarda físicamente en la ruta estática configurada en tu computadora.
    """
    # Si viene en None (como cuando se llama con un solo parámetro), 
    # evalúa la variable en caliente en este microsegundo
    if url_base is None:
        url_base = os.getenv("FRONTEND_URL", "http://localhost:3000")

    try:
        os.makedirs(settings.STATIC_QR_DIR, exist_ok=True)
        
        qr = _configurar_objeto_qr(id_mascota, url_base)
        imagen_qr = qr.make_image(fill_color="black", back_color="white")
        
        ruta_archivo = settings.STATIC_QR_DIR / f"qr_{id_mascota}.png"
        imagen_qr.save(ruta_archivo)
        
        return str(ruta_archivo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en generación por archivo: {str(e)}")


# --- BLOQUE DE EJECUCIÓN DIRECTA (SÓLO PARA SCRIPT DE CONSOLA) ---
if __name__ == "__main__":
    print("--- Generador de QR Local para Imprenta ---")
    id_test = input("Ingresá el ID de la mascota para el archivo (ej: PET-12345): ").strip()
    
    if id_test:
        try:
            # En consola llamamos a la lógica tradicional que guarda el .png en la PC
            ruta_resultado = generar_qr_medalla(id_test)
            print(f"\n¡Éxito! El código QR con alta tolerancia fue generado.")
            print(f"Guardado en: {ruta_resultado}")
        except Exception as e:
            print(f"Error al generar el QR: {e}")
    else:
        print("ID inválido. Operación cancelada.")