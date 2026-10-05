from datetime import datetime, timedelta, timezone
from uuid import UUID

VETERINARIAN_ID = UUID("50000000-0000-4000-8000-000000000001")
CLIENT_ID = UUID("50000000-0000-4000-8000-000000000002")
PET_ID = UUID("50000000-0000-4000-8000-000000000003")
QR_ID = UUID("50000000-0000-4000-8000-000000000004")

CLIENT = {
    "id": CLIENT_ID,
    "nombre": "Ana Ejemplo",
    "email": "ana.ejemplo@example.test",
    "telefono": "+5491100000000",
    "mascotas_count": 1,
    "pending_activation": False,
}

PET = {
    "id": PET_ID,
    "usuario_id": CLIENT_ID,
    "nombre": "Luna",
    "especie": "perro",
    "estado": "en_casa",
}

QR = {
    "id": QR_ID,
    "codigo": "QR-DEMO-0001",
    "activo": True,
    "mascota_id": PET_ID,
    "mascota_nombre": "Luna",
    "dueno_nombre": CLIENT["nombre"],
}

APPOINTMENT_START = datetime.now(timezone.utc) + timedelta(days=1)
APPOINTMENT = {
    "mascota_id": str(PET_ID),
    "dueno_id": str(CLIENT_ID),
    "fecha_hora_inicio": APPOINTMENT_START.isoformat(),
    "fecha_hora_fin": (APPOINTMENT_START + timedelta(minutes=30)).isoformat(),
    "tipo_servicio": "Control general",
    "observaciones": "Turno de ejemplo para pruebas.",
}

MEDICAL_RECORD = {
    "mascota_id": str(PET_ID),
    "motivo_consulta": "Control anual",
    "diagnostico": "Paciente en buen estado general.",
    "tratamiento": "Vacunación anual.",
    "peso_kg": 12.4,
    "temperatura_c": 38.5,
    "adjuntos": [],
}
