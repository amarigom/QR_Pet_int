import io
import os
from pathlib import Path
import qrcode
from fastapi import HTTPException
from app.config import settings  

# --- CONFIGURACIÓN CORE DEL QR ---
def configurar_objeto_qr(id_mascota: str, url_base: str = None) -> qrcode.QRCode:
    """
    Función interna para estructurar la URL y configurar el QR con alta tolerancia (ERROR_CORRECT_H).
    Evita repetir código en la versión de memoria y de archivo.
    """
    # Inicializamos el objeto QR con alta tolerancia para escaneos en medallas físicas
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    # 🎯 URL DEFINITIVA: Apunta al frontend correcto, en singular (/scan/) y con el subdominio de producción
    url_final = f"https://qr-pet-int-8ki3.vercel.app/scan/{id_mascota}"
        
    # Inyectamos la URL limpia en el objeto QR
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
        # Usamos la función core unificada (sin barra baja)
        qr = configurar_objeto_qr(id_mascota)
        imagen_qr = qr.make_image(fill_color="black", back_color="white")
        
        buffer_ram = io.BytesIO()
        imagen_qr.save(buffer_ram, format="PNG")
        buffer_ram.seek(0)  # Volvemos al inicio del archivo virtual
        return buffer_ram
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en generación por memoria: {str(e)}")


# --- LÓGICA B: EN DISCO (Para ejecuciones locales e imprenta) ---
def generar_qr_medalla(id_mascota: str, url_base: str = None) -> str:
    """
    Genera un código QR con alta tolerancia a fallos
    y lo guarda físicamente en la ruta estática configurada en tu computadora.
    """
    if url_base is None:
        url_base = os.getenv("FRONTEND_URL", "http://localhost:3000")

    try:
        os.makedirs(settings.STATIC_QR_DIR, exist_ok=True)
        
        # Usamos la función core unificada (sin barra baja)
        qr = configurar_objeto_qr(id_mascota, url_base)
        imagen_qr = qr.make_image(fill_color="black", black_color="white")
        
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