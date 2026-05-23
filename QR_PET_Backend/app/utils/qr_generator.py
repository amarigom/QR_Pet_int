
import os
import qrcode
from pathlib import Path

# Definimos la ruta base para guardar las imágenes (por defecto en una carpeta 'outputs')
BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "static" / "qrcodes"

def generar_qr_medalla(id_mascota: str, url_base: str = "https://qr-pet-int-prueba2.vercel.app/scan/") -> str:
    """
    Genera un código QR con alta tolerancia a fallos (30% de daño máximo)
    y lo guarda en el disco.
    """
    # 1. Asegurar que la carpeta de salida exista
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 2. Configurar la URL final que va a leer el celular
    url_final = f"{url_base}{id_mascota}"
    
    # 3. Configurar el generador QR con tolerancia Alta (ERROR_CORRECT_H)
    qr = qrcode.QRCode(
        version=None, # None permite que el tamaño se adapte automáticamente al texto
        error_correction=qrcode.constants.ERROR_CORRECT_H, # Alta tolerancia para medallas de calle
        box_size=10,  # Tamaño de los píxeles del QR
        border=4,     # Margen blanco reglamentario
    )
    
    qr.add_data(url_final)
    qr.make(fit=True)
    
    # 4. Crear la imagen (máximo contraste: negro y blanco puro)
    imagen_qr = qr.make_image(fill_color="black", back_color="white")
    
    # 5. Guardar el archivo
    ruta_archivo = OUTPUT_DIR / f"qr_{id_mascota}.png"
    imagen_qr.save(ruta_archivo)
    
    return str(ruta_archivo)


# --- BLOQUE DE EJECUCIÓN DIRECTA (SÓLO PARA SCRIPT) ---
if __name__ == "__main__":
    # Este bloque solo se ejecuta si llamás al archivo directamente desde la terminal
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