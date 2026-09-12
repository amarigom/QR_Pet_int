import os
from google import genai

# Obtener API Key desde las variables de entorno
api_key = os.getenv("GEMINI_API_KEY")

# Instanciar el cliente oficial de Google GenAI
if api_key:
    embedding_client = genai.Client(api_key=api_key)
else:
    embedding_client = genai.Client() # Intentará leer GEMINI_API_KEY automáticamente del entorno