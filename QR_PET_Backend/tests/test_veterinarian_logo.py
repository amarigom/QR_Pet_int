import io
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from PIL import Image

from app.config import settings
from app.services.veterinarian_profile_service import VeterinarianProfileService


def make_png(mode: str, color):
    image = Image.new(mode, (16, 16), color)
    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("mode", "color"),
    [
        ("RGB", (30, 90, 200)),
        ("RGBA", (30, 90, 200, 120)),
        ("L", 128),
        ("P", 1),
    ],
)
async def test_upload_accepts_and_normalizes_valid_png(monkeypatch, tmp_path, mode, color):
    veterinarian_id = uuid4()
    profile = SimpleNamespace(
        user_id=veterinarian_id,
        activo=True,
        logo_url=None,
    )
    repository = SimpleNamespace(
        get_active_profile=AsyncMock(return_value=profile),
        update_active_profile_logo=AsyncMock(
            side_effect=lambda _user_id, logo_url: (
                setattr(profile, "logo_url", logo_url) or profile
            )
        ),
    )
    monkeypatch.setattr(settings, "STATIC_BRAND_DIR", tmp_path)

    result = await VeterinarianProfileService(repository).update_logo(
        veterinarian_id,
        make_png(mode, color),
    )

    filename = result.logo_url.removeprefix("/static/brands/")
    assert filename.startswith(f"{veterinarian_id}-")
    assert filename.endswith(".webp")
    saved_image = Image.open(tmp_path / filename)
    assert saved_image.format == "WEBP"
    repository.update_active_profile_logo.assert_awaited_once_with(
        veterinarian_id, result.logo_url
    )


@pytest.mark.asyncio
async def test_upload_reports_invalid_image_for_corrupt_png(monkeypatch, tmp_path):
    veterinarian_id = uuid4()
    repository = SimpleNamespace(
        get_active_profile=AsyncMock(
            return_value=SimpleNamespace(user_id=veterinarian_id, activo=True)
        ),
        update_active_profile_logo=AsyncMock(),
    )
    monkeypatch.setattr(settings, "STATIC_BRAND_DIR", tmp_path)

    with pytest.raises(HTTPException) as error:
        await VeterinarianProfileService(repository).update_logo(
            veterinarian_id, b"not an image"
        )

    assert error.value.status_code == 400
    assert error.value.detail == "El archivo no es una imagen válida."
    repository.update_active_profile_logo.assert_not_awaited()


@pytest.mark.asyncio
async def test_upload_reports_storage_failure_separately_from_invalid_image(
    monkeypatch, tmp_path
):
    veterinarian_id = uuid4()
    profile = SimpleNamespace(user_id=veterinarian_id, activo=True, logo_url=None)
    repository = SimpleNamespace(
        get_active_profile=AsyncMock(return_value=profile),
        update_active_profile_logo=AsyncMock(),
    )
    png_contents = make_png("RGB", (30, 90, 200))
    monkeypatch.setattr(settings, "STATIC_BRAND_DIR", tmp_path / "missing-parent" / "brands")
    monkeypatch.setattr(
        "app.services.veterinarian_profile_service.Image.Image.save",
        lambda *args, **kwargs: (_ for _ in ()).throw(OSError("storage unavailable")),
    )

    with pytest.raises(HTTPException) as error:
        await VeterinarianProfileService(repository).update_logo(
            veterinarian_id, png_contents
        )

    assert error.value.status_code == 500
    assert error.value.detail == "No se pudo guardar el logo en el servidor."
    repository.update_active_profile_logo.assert_not_awaited()


@pytest.mark.asyncio
async def test_upload_removes_new_file_when_profile_update_fails(monkeypatch, tmp_path):
    veterinarian_id = uuid4()
    profile = SimpleNamespace(user_id=veterinarian_id, activo=True, logo_url=None)
    repository = SimpleNamespace(
        get_active_profile=AsyncMock(return_value=profile),
        update_active_profile_logo=AsyncMock(side_effect=RuntimeError("database unavailable")),
    )
    monkeypatch.setattr(settings, "STATIC_BRAND_DIR", tmp_path)

    with pytest.raises(RuntimeError, match="database unavailable"):
        await VeterinarianProfileService(repository).update_logo(
            veterinarian_id, make_png("RGB", (30, 90, 200))
        )

    assert list(tmp_path.glob("*.webp")) == []


@pytest.mark.asyncio
async def test_upload_removes_previous_logo_after_profile_update(monkeypatch, tmp_path):
    veterinarian_id = uuid4()
    previous_logo = tmp_path / "old-logo.webp"
    previous_logo.write_bytes(b"old logo")
    profile = SimpleNamespace(
        user_id=veterinarian_id,
        activo=True,
        logo_url="/static/brands/old-logo.webp",
    )

    async def update_profile(_user_id, logo_url):
        profile.logo_url = logo_url
        return profile

    repository = SimpleNamespace(
        get_active_profile=AsyncMock(return_value=profile),
        update_active_profile_logo=AsyncMock(side_effect=update_profile),
    )
    monkeypatch.setattr(settings, "STATIC_BRAND_DIR", tmp_path)

    result = await VeterinarianProfileService(repository).update_logo(
        veterinarian_id, make_png("RGB", (30, 90, 200))
    )

    assert not previous_logo.exists()
    assert (tmp_path / result.logo_url.removeprefix("/static/brands/")).exists()
