
import os
import qrcode
from pathlib import Path
from app.config import settings  

def generar_qr_medalla(id_mascota: str, url_base: str = None) -> str:
    """
    Genera un código QR con alta tolerancia a fallos (30% de daño máximo)
    y lo guarda en la ruta estática configurada en el proyecto.
    """
    
    if url_base is None:
        
        base_limpia = settings.FRONTEND_URL.rstrip('/')
        url_base = f"{base_limpia}/scans/"

    os.makedirs(settings.STATIC_QR_DIR, exist_ok=True)
    
    url_final = f"{url_base}{id_mascota}"
    
    # 4. Configurar el generador QR con tolerancia Alta (ERROR_CORRECT_H)
    qr = qrcode.QRCode(
        version=None, # None permite que el tamaño se adapte automáticamente al texto
        error_correction=qrcode.constants.ERROR_CORRECT_H, # Alta tolerancia para medallas de calle
        box_size=10,  # Tamaño de los píxeles del QR
        border=4,     # Margen blanco reglamentario
    )
    
    qr.add_data(url_final)
    qr.make(fit=True)
    imagen_qr = qr.make_image(fill_color="black", back_color="white")
    
    ruta_archivo = settings.STATIC_QR_DIR / f"qr_{id_mascota}.png"
    imagen_qr.save(ruta_archivo)
    
    return str(ruta_archivo)


# --- BLOQUE DE EJECUCIÓN DIRECTA (SÓLO PARA SCRIPT) ---
if __name__ == "__main__":
    print("--- Generador de QR para Testeo ---")
    id_test = input("Ingresá el ID de la mascota para la prueba (ej: PET-12345): ").strip()
    
    if id_test:
        try:
            ruta_resultado = generar_qr_medalla(id_test)
            print(f"\n¡Éxito! El código QR con alta tolerancia fue generado.")
            print(f"Guardado en: {ruta_resultado}")
        except Exception as e:
            print(f"Error al generar el QR: {e}")
    else:
        print("ID inválido. Operación cancelada.")