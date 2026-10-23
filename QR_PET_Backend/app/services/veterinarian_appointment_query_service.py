import asyncio
import json
import logging
import re
import unicodedata
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from google.genai import types
from pydantic import ValidationError

from app.models.turno import EstadoTurno
from app.models.user import User
from app.repositories.turno_repository import TurnoRepository
from app.schemas.assistant_appointment_query import (
    AssistantAppointmentItem,
    AssistantAppointmentQueryIntent,
    AssistantAppointmentQueryResponse,
)

logger = logging.getLogger("uvicorn.error")
ARGENTINA_TIMEZONE = ZoneInfo("America/Argentina/Buenos_Aires")
QUERY_TERMS = re.compile(r"\b(turnos?|citas?|agenda)\b")
WRITE_TERMS = re.compile(
    r"\b(agend\w*|reserv\w*|crea\w*|registra\w*|anot\w*|carg\w*|guarda\w*|"
    r"agrega\w*|actualiza\w*|modifica\w*|corrige\w*|quiero|necesito|"
    r"programar|programa(?:me|lo)?|programen|programemos|"
    r"saca\w*|pone\w*|poneme|anota\w*)\b"
)
SUMMARY_TERMS = re.compile(r"\b(cuant\w*|cantidad|resumen|total)\b")
STATUS_TERMS = {
    EstadoTurno.PROGRAMADO: re.compile(r"\b(programad\w*|pendient\w*)\b"),
    EstadoTurno.ATENDIDO: re.compile(r"\b(atendid\w*|realizad\w*|cumplid\w*)\b"),
    EstadoTurno.CANCELADO: re.compile(r"\b(cancelad\w*)\b"),
}
THIS_WEEK_TERMS = re.compile(r"\besta semana\b")
DATE_RANGE_TERMS = re.compile(
    r"\b(?:del|desde)\s+(\d{1,2})(?:\s+de\s+([a-z]+))?\s+"
    r"(?:al|hasta)\s+(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?\b"
)
SPANISH_MONTHS = {
    "enero": 1,
    "febrero": 2,
    "marzo": 3,
    "abril": 4,
    "mayo": 5,
    "junio": 6,
    "julio": 7,
    "agosto": 8,
    "septiembre": 9,
    "setiembre": 9,
    "octubre": 10,
    "noviembre": 11,
    "diciembre": 12,
}


def _normalize_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


class VeterinarianAppointmentQueryService:
    def __init__(self, db, ai_client, veterinarian: User):
        self.repository = TurnoRepository(db)
        self.ai_client = ai_client
        self.veterinarian = veterinarian

    @staticmethod
    def looks_like_query(question: str) -> bool:
        normalized = _normalize_text(question)
        return bool(QUERY_TERMS.search(normalized)) and not bool(
            WRITE_TERMS.search(normalized)
        )

    async def query(
        self, question: str, history: list[dict[str, str]] | None = None
    ) -> AssistantAppointmentQueryResponse:
        if not self.looks_like_query(question):
            return AssistantAppointmentQueryResponse(estado="sin_consulta")

        intent = await self._extract_intent(question, history or [])

        normalized_question = _normalize_text(question)
        today = datetime.now(ARGENTINA_TIMEZONE).date()
        if intent.tipo_consulta == "ninguna":
            intent.tipo_consulta = (
                "resumen" if SUMMARY_TERMS.search(normalized_question) else "listar"
            )
        if SUMMARY_TERMS.search(normalized_question):
            intent.tipo_consulta = "resumen"
        for status, pattern in STATUS_TERMS.items():
            if pattern.search(normalized_question):
                intent.estado = status.value
                break
        if THIS_WEEK_TERMS.search(normalized_question):
            start_of_week = today - timedelta(days=today.weekday())
            intent.fecha_desde = start_of_week
            intent.fecha_hasta = start_of_week + timedelta(days=6)
        else:
            explicit_range = self._parse_spanish_date_range(
                normalized_question, today.year
            )
            if explicit_range:
                intent.fecha_desde, intent.fecha_hasta = explicit_range

        if intent.fecha_desde and intent.fecha_hasta and intent.fecha_hasta < intent.fecha_desde:
            return AssistantAppointmentQueryResponse(
                estado="aclaracion",
                respuesta="La fecha final es anterior a la fecha inicial. ¿Qué período querés consultar?",
            )

        start_date = intent.fecha_desde or today
        end_date = intent.fecha_hasta or (
            start_date if intent.fecha_desde else today + timedelta(days=6)
        )
        if (end_date - start_date).days > 30:
            return AssistantAppointmentQueryResponse(
                estado="aclaracion",
                respuesta="Puedo consultar hasta 31 días por vez. Indicame un período más corto.",
            )

        start = self._local_midnight_utc_naive(start_date)
        end = self._local_midnight_utc_naive(end_date + timedelta(days=1))
        state = EstadoTurno(intent.estado) if intent.estado else None

        if intent.tipo_consulta == "resumen":
            counts = await self.repository.count_for_assistant(
                veterinarian_id=self.veterinarian.id,
                start=start,
                end=end,
                pet_name=intent.mascota_nombre,
                state=state,
                include_cancelled=state is None,
            )
            count_text = ", ".join(
                f"{self._state_label(status)}: {count}"
                for status, count in counts.items()
                if count
            ) or "sin turnos"
            qualifier = (
                f" para {intent.mascota_nombre}" if intent.mascota_nombre else ""
            )
            return AssistantAppointmentQueryResponse(
                estado="resultado",
                respuesta=(
                    f"Del {start_date:%d/%m/%Y} al {end_date:%d/%m/%Y}"
                    f"{qualifier}: {count_text}. Total: {sum(counts.values())}."
                ),
                resumen=counts,
            )

        appointments = await self.repository.list_for_assistant(
            veterinarian_id=self.veterinarian.id,
            start=start,
            end=end,
            pet_name=intent.mascota_nombre,
            state=state,
            limit=51,
        )
        if not appointments:
            return AssistantAppointmentQueryResponse(
                estado="resultado",
                respuesta=(
                    f"No encontré turnos{f' para {intent.mascota_nombre}' if intent.mascota_nombre else ''} "
                    f"entre el {start_date:%d/%m/%Y} y el {end_date:%d/%m/%Y}."
                ),
            )

        has_more = len(appointments) > 50
        items = [
            AssistantAppointmentItem(
                id=turno.id,
                mascota_nombre=pet_name,
                fecha_hora_inicio=self._as_argentina_time(turno.fecha_hora_inicio),
                fecha_hora_fin=self._as_argentina_time(turno.fecha_hora_fin),
                tipo_servicio=turno.tipo_servicio,
                estado=turno.estado.value,
            )
            for turno, pet_name in appointments[:50]
        ]
        return AssistantAppointmentQueryResponse(
            estado="resultado",
            respuesta=(
                f"Encontré {len(items)} turno(s) entre el {start_date:%d/%m/%Y} "
                f"y el {end_date:%d/%m/%Y}."
                + (" Se muestran los primeros 50; acotá la fecha o mascota para ver menos." if has_more else "")
            ),
            turnos=items,
        )

    async def _extract_intent(
        self, question: str, history: list[dict[str, str]]
    ) -> AssistantAppointmentQueryIntent:
        now = datetime.now(ARGENTINA_TIMEZONE)
        prompt = f"""
Interpretá únicamente consultas de lectura de la agenda del veterinario.
No propongas crear ni modificar turnos. Devolvé el JSON del esquema.
Si el mensaje no pregunta por turnos o agenda, usa tipo_consulta=ninguna.
Usá listar para pedir citas concretas y resumen para preguntas de cantidad/resumen.
fecha_desde y fecha_hasta son fechas locales de Argentina, inclusivas.
Para "hoy", usa hoy como fecha_desde y fecha_hasta. Para "mañana", usa mañana
en ambos campos. Para "esta semana", usa desde el lunes hasta el domingo de la semana calendario local.
Si no menciona fecha y pregunta por próximos turnos, dejalas vacías.
estado solo se completa si pide explícitamente PROGRAMADO, ATENDIDO o CANCELADO.
Interpretá "pendiente" como PROGRAMADO, "realizado" como ATENDIDO y
"cancelado" como CANCELADO.
mascota_nombre solo se completa si la identifica explícitamente.
La fecha y hora local actual es {now.isoformat()}.

HISTORIAL:
{json.dumps(history[-6:], ensure_ascii=False)}

PREGUNTA:
{question}
"""
        try:
            response = await asyncio.to_thread(
                self.ai_client.models.generate_content,
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=self._response_schema(),
                    temperature=0,
                ),
            )
            parsed = getattr(response, "parsed", None)
            if parsed is not None:
                return AssistantAppointmentQueryIntent.model_validate(parsed)
            if not response.text:
                raise ValueError("El modelo no devolvió los filtros de consulta.")
            return AssistantAppointmentQueryIntent.model_validate_json(response.text)
        except (ValidationError, ValueError) as error:
            logger.exception("La respuesta estructurada de consulta de turnos no es válida.")
            raise RuntimeError("No se pudo interpretar la consulta de turnos.") from error
        except Exception as error:
            logger.exception("Falló la interpretación de una consulta de turnos.")
            raise RuntimeError("No se pudo interpretar la consulta de turnos.") from error

    @staticmethod
    def _response_schema() -> types.Schema:
        return types.Schema(
            type="OBJECT",
            properties={
                "tipo_consulta": types.Schema(
                    type="STRING", enum=["ninguna", "listar", "resumen"]
                ),
                "fecha_desde": types.Schema(type="STRING"),
                "fecha_hasta": types.Schema(type="STRING"),
                "mascota_nombre": types.Schema(type="STRING"),
                "estado": types.Schema(
                    type="STRING",
                    enum=["PROGRAMADO", "ATENDIDO", "CANCELADO"],
                ),
            },
            required=["tipo_consulta"],
        )

    @staticmethod
    def _local_midnight_utc_naive(value: date) -> datetime:
        local = datetime.combine(value, time.min, tzinfo=ARGENTINA_TIMEZONE)
        return local.astimezone(timezone.utc).replace(tzinfo=None)

    @staticmethod
    def _parse_spanish_date_range(
        question: str, current_year: int
    ) -> tuple[date, date] | None:
        match = DATE_RANGE_TERMS.search(question)
        if not match:
            return None
        start_day, start_month_name, end_day, end_month_name, year_text = match.groups()
        end_month = SPANISH_MONTHS.get(end_month_name)
        start_month = SPANISH_MONTHS.get(start_month_name or end_month_name)
        if start_month is None or end_month is None:
            return None
        year = int(year_text) if year_text else current_year
        try:
            start_date = date(year, start_month, int(start_day))
            end_year = year + (1 if start_month == 12 and end_month == 1 else 0)
            end_date = date(end_year, end_month, int(end_day))
        except ValueError:
            return None
        return (start_date, end_date) if start_date <= end_date else None

    @staticmethod
    def _as_argentina_time(value: datetime) -> datetime:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(ARGENTINA_TIMEZONE)

    @staticmethod
    def _state_label(value: str) -> str:
        return {
            EstadoTurno.PROGRAMADO.value: "programados",
            EstadoTurno.ATENDIDO.value: "atendidos",
            EstadoTurno.CANCELADO.value: "cancelados",
        }[value]
