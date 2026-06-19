import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from app.config import settings

async def send_scan_notification_email(to_email: str, owner_name: str, pet_name: str, ubicacion_ip: str = "No especificada"):
    """
    Envía una alerta por correo electrónico usando el SMTP gratuito de Brevo.
    Se ejecuta en un hilo secundario para evitar congelar la API de petRQ.
    """
    loop = asyncio.get_event_loop()
    
    def _send_sync():
        msg = MIMEMultipart()
        
        # El remitente debe ser el correo de Gmail que registraste en Brevo
        msg['From'] = settings.SMTP_USER
        msg['To'] = to_email  # El correo del dueño de la mascota (Gmail, Hotmail, etc.)
        msg['Subject'] = f"🚨 ¡Alerta petRQ! El código QR de {pet_name} ha sido escaneado"
        
        body = f"""
        Hola {owner_name},
        
        Te informamos que alguien acaba de escanear el código QR del collar de {pet_name} en Tandil.
        
        📍 Ubicación aproximada por red móvil: {ubicacion_ip}
        
        Si el transeúnte decide compartir su ubicación GPS precisa de alta fidelidad o enviarte un WhatsApp directo, los datos se actualizarán de inmediato en tu panel de control.
        
        ¡Mantente atento!
        El equipo de petRQ.
        """
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Conexión segura a la infraestructura de Brevo
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()  # Cifrado de seguridad obligatorio
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    # Despachamos el proceso síncrono fuera del loop principal de FastAPI
    await loop.run_in_executor(None, _send_sync)