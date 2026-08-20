import json
import os
from groq import Groq
from dotenv import load_dotenv
from app.services.agent_tools import TOOLS_SCHEMA, AVAILABLE_TOOLS

load_dotenv()

class GroqAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"

    async def procesar_consulta(self, user_lat: float, user_lng: float) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "Sos un asistente útil. Tu tarea es consultar la lista de veterinarias, "
                    "calcular la distancia a la ubicación del usuario y presentar un resumen ordenado por cercanía."
                )
            },
            {
                "role": "user",
                "content": f"Estoy en latitud {user_lat} y longitud {user_lng}. ¿Qué veterinarias tengo cerca?"
            }
        ]

        # 1. Enviar mensaje inicial con las herramientas disponibles
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOLS_SCHEMA,
            tool_choice="auto"
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        # 2. Si el modelo solicita ejecutar herramientas
        if tool_calls:
            messages.append(response_message)

            for tool_call in tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)

                # Ejecutar la función Python correspondiente
                func_result = AVAILABLE_TOOLS[func_name](**func_args)

                # Devolver el resultado al historial del chat
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": func_name,
                    "content": json.dumps(func_result)
                })

            # 3. Respuesta final resumida por el modelo
            final_response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            return final_response.choices[0].message.content

        return response_message.content