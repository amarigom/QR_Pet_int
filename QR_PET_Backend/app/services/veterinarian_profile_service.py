import io
import logging
import uuid
from pathlib import Path

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

from app.config import settings
from app.models.veterinario import PerfilVeterinario
from app.repositories.veterinario_repository import VeterinarioRepository

logger = logging.getLogger("uvicorn.error")

MAX_LOGO_BYTES = 2 * 1024 * 1024
MAX_LOGO_PIXELS = 25_000_000
SUPPORTED_LOGO_FORMATS = {"PNG", "JPEG", "WEBP"}


class VeterinarianProfileService:
    def __init__(self, repository: VeterinarioRepository):
        self.repository = repository

    async def update_logo(
        self, veterinarian_id: uuid.UUID, contents: bytes
    ) -> PerfilVeterinario:
        if len(contents) > MAX_LOGO_BYTES:
            raise HTTPException(status_code=413, detail="El logo no puede superar los 2 MB.")
        if not contents:
            raise HTTPException(status_code=400, detail="El archivo está vacío.")

        profile = await self.repository.get_active_profile(veterinarian_id)
        if profile is None:
            raise HTTPException(
                status_code=404,
                detail="No se encontró un perfil veterinario activo.",
            )

        normalized = self._normalize_image(contents)
        previous_logo_url = profile.logo_url
        filename = f"{veterinarian_id}-{uuid.uuid4().hex}.webp"
        destination = Path(settings.STATIC_BRAND_DIR) / filename
        try:
            destination.parent.mkdir(parents=True, exist_ok=True)
            normalized.save(destination, format="WEBP", quality=88, method=6)
        except OSError as error:
            logger.exception("No se pudo guardar el logo de la veterinaria %s.", veterinarian_id)
            raise HTTPException(
                status_code=500,
                detail="No se pudo guardar el logo en el servidor.",
            ) from error

        try:
            updated_profile = await self.repository.update_active_profile_logo(
                veterinarian_id, f"/static/brands/{filename}"
            )
            if updated_profile is None:
                raise HTTPException(
                    status_code=404,
                    detail="No se encontró un perfil veterinario activo.",
                )
            self._remove_previous_logo(previous_logo_url, destination)
            return updated_profile
        except Exception:
            try:
                destination.unlink(missing_ok=True)
            except OSError:
                logger.exception("No se pudo limpiar el logo no asociado %s.", destination)
            raise

    @staticmethod
    def _remove_previous_logo(previous_logo_url: str | None, new_destination: Path) -> None:
        if not previous_logo_url or not previous_logo_url.startswith("/static/brands/"):
            return
        previous_destination = new_destination.parent / Path(previous_logo_url).name
        if previous_destination == new_destination:
            return
        try:
            previous_destination.unlink(missing_ok=True)
        except OSError:
            logger.exception("No se pudo limpiar el logo anterior %s.", previous_destination)

    @staticmethod
    def _normalize_image(contents: bytes) -> Image.Image:
        try:
            with Image.open(io.BytesIO(contents)) as image:
                if image.format not in SUPPORTED_LOGO_FORMATS:
                    raise HTTPException(
                        status_code=400,
                        detail="El logo debe ser una imagen PNG, JPG o WebP.",
                    )
                if image.width * image.height > MAX_LOGO_PIXELS:
                    raise HTTPException(
                        status_code=413,
                        detail="La resolución del logo no puede superar los 25 megapíxeles.",
                    )
                image.verify()
            with Image.open(io.BytesIO(contents)) as image:
                image.load()
                image.thumbnail((512, 512), Image.Resampling.LANCZOS)
                return image.convert("RGBA")
        except Image.DecompressionBombError as error:
            raise HTTPException(
                status_code=413,
                detail="La resolución del logo es demasiado grande para procesarla.",
            ) from error
        except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as error:
            logger.warning("Logo veterinario inválido: %s", error, exc_info=True)
            raise HTTPException(
                status_code=400,
                detail="El archivo no es una imagen válida.",
            ) from error
