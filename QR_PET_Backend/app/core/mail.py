# 📁 Reemplazá TODO el contenido de app/core/mail.py con esto:
import smtplib
import os  # 🎯 Leemos directo del .env para esquivar el 'settings'
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio

async def send_scan_notification_email(
    to_email: str, 
    owner_name: str, 
    pet_name: str, 
    mensaje: str , 
    ubicacion_ip: str = "No especificada",
     # 🎯 Agregamos con valor por defecto
    telefono: str = "No proporcionado"   # 🎯 Agregamos con valor por defecto
):
    """
    Envía una alerta por correo electrónico usando el SMTP de Resend.
    Usa os.getenv para evitar el error de atributos de Settings.
    """
    loop = asyncio.get_event_loop()
    
    # Levantamos del .env de forma directa
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.resend.com")  # Tu relay de Resend
    
    try:
        smtp_port = int(os.getenv("SMTP_PORT", 587))
    except:
        smtp_port = 587

    def _send_sync():
        if not smtp_user or not smtp_pass:
            print("\n❌ [RESEND-SMTP] Error: No se encontraron las variables SMTP_USER o SMTP_PASSWORD en el .env")
            return

        msg = MIMEMultipart()
        msg['From'] = "onboarding@resend.dev"  # Tu remitente fijo de pruebas de Resend
        msg['To'] = "andreamarigomez@gmail.com"                 # 🎯 Dinámico: El mail del dueño que llega del servicio
        msg['Subject'] = f"🚨 ¡Alerta petRQ! El código QR de {pet_name} ha sido escaneado"
        
        body = f"""
        Hola {owner_name},
        
        Te informamos que alguien acaba de escanear el código QR del collar de {pet_name}.
        
        📍 Ubicación de Coordenadas: {ubicacion_ip}
        
        💬 Mensaje dejado por el encontrador:
        "{mensaje}"
        
        📞 Teléfono de contacto: {telefono}
        
        Si el transeúnte decide compartir su ubicación GPS precisa de alta fidelidad o enviarte un WhatsApp directo, los datos se actualizarán de inmediato en tu panel de control.
        
        ¡Mantente atento!
        El equipo de petRQ.
        """
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()  
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
                print(f"\n📧 [RESEND-SMTP] ¡Correo enviado con éxito a {to_email} por el escaneo de {pet_name}!")
        except Exception as e:
            print(f"\n❌ [RESEND-SMTP] Error crítico al conectar/autenticar con Resend: {e}")

    # Ejecutamos en el executor síncrono
    await loop.run_in_executor(None, _send_sync)