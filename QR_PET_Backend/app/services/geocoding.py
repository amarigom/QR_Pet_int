import httpx

async def obtener_direccion_reversa(lat: float, lon: float) -> str:
    if not lat or not lon:
        return "Ubicación sin coordenadas"
        
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1"
    headers = {
        "User-Agent": "QrPetApp/1.0 (andreamarigomez@gmail.com)" 
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=3.0)
            if response.status_code == 429:
                print("⚠️ [Nominatim API] Rate limit alcanzado (429). Fallback activo.")
                return "Ubicación aproximada"
            if response.status_code == 200:
                data = response.json()
                return data.get("display_name", "Ubicación aproximada")
    except Exception as e:
        print(f"🚨 [Geocoding Error]: {str(e)}")
        
    return "Ubicación aproximada"