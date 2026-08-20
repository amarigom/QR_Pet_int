import time
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any

_CACHE_DATA: List[Dict[str, str]] = []
_LAST_FETCH_TIME: float = 0
CACHE_DURATION_SECONDS = 1800  # 30 minutos

class NewsAgent:
    @staticmethod
    async def get_rabies_alerts() -> List[Dict[str, str]]:
        global _CACHE_DATA, _LAST_FETCH_TIME
        current_time = time.time()
        
        # Si la caché tiene menos de 30 minutos, la devolvemos inmediatamente
        if _CACHE_DATA and (current_time - _LAST_FETCH_TIME < CACHE_DURATION_SECONDS):
            return _CACHE_DATA

        alerts = []
        target_url = "https://www.eleco.com.ar/locales"
        keywords = ["murciélago", "rabia", "anillo sanitario", "bromatología", "vacunación"]

        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36"
            }
            # Consultamos la web mediante HTTP asíncrono sin levantar un navegador
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(target_url, headers=headers)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    articles = soup.find_all("article")

                    for article in articles[:15]:
                        text_content = article.get_text()
                        
                        if any(kw in text_content.lower() for kw in keywords):
                            title_elem = article.find(["h2", "h3", "a"])
                            link_elem = article.find("a")

                            title = title_elem.get_text().strip() if title_elem else "Alerta Sanitaria Detectada"
                            raw_link = link_elem.get("href", "") if link_elem else ""
                            full_link = raw_link if raw_link.startswith("http") else f"https://www.eldiariodetandil.com{raw_link}"

                            alerts.append({
                                "titulo": title,
                                "link": full_link,
                                "fuente": "El Diario de Tandil"
                            })

                    _CACHE_DATA = alerts
                    _LAST_FETCH_TIME = current_time

        except Exception as e:
            print(f"Error realizando scraping con httpx: {e}")
            return _CACHE_DATA

        return _CACHE_DATA