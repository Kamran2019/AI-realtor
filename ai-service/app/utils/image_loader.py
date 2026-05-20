from dataclasses import dataclass
from io import BytesIO
from ipaddress import ip_address
from urllib.parse import urlparse

from app.core.config import Settings, get_settings


ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ImageLoadError(RuntimeError):
    pass


class InvalidImageUrlError(ImageLoadError):
    pass


class ImageDownloadTimeoutError(ImageLoadError):
    pass


class UnsupportedImageTypeError(ImageLoadError):
    pass


class ImageTooLargeError(ImageLoadError):
    pass


@dataclass(frozen=True)
class LoadedImage:
    image: object
    width: int
    height: int
    content_type: str


def _is_private_host(hostname: str | None) -> bool:
    if not hostname:
        return True

    normalized = hostname.strip().lower()
    if normalized in {"localhost", "localhost.localdomain"}:
        return True

    try:
        address = ip_address(normalized)
    except ValueError:
        return False

    return (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_reserved
        or address.is_multicast
    )


def _validate_url(image_url: str, settings: Settings) -> None:
    parsed = urlparse(image_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise InvalidImageUrlError("Image URL must be an HTTP or HTTPS URL.")

    if _is_private_host(parsed.hostname) and not settings.allow_private_image_urls:
        raise InvalidImageUrlError("Private image URLs are not allowed.")


def _content_type(value: str | None) -> str:
    return (value or "").split(";", 1)[0].strip().lower()


def load_image(image_url: str, settings: Settings | None = None) -> LoadedImage:
    active_settings = settings or get_settings()
    _validate_url(image_url, active_settings)

    try:
        import requests
    except ImportError as exc:
        raise ImageLoadError("The requests package is required to load images.") from exc

    try:
        from PIL import Image
    except ImportError as exc:
        raise ImageLoadError("The pillow package is required to load images.") from exc

    max_bytes = active_settings.max_image_mb * 1024 * 1024

    try:
        response = requests.get(
            image_url,
            headers={"Accept": "image/jpeg,image/png,image/webp"},
            stream=True,
            timeout=active_settings.request_timeout_seconds,
        )
    except requests.Timeout as exc:
        raise ImageDownloadTimeoutError("Image download timed out.") from exc
    except requests.RequestException as exc:
        raise InvalidImageUrlError("Image could not be downloaded.") from exc

    if response.status_code >= 400:
        raise InvalidImageUrlError("Image URL returned an error response.")

    content_type = _content_type(response.headers.get("content-type"))
    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise UnsupportedImageTypeError("Unsupported image MIME type.")

    content_length = response.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > max_bytes:
                raise ImageTooLargeError("Image exceeds the maximum allowed size.")
        except ValueError:
            pass

    image_bytes = BytesIO()
    try:
        for chunk in response.iter_content(chunk_size=1024 * 64):
            if not chunk:
                continue

            image_bytes.write(chunk)
            if image_bytes.tell() > max_bytes:
                raise ImageTooLargeError("Image exceeds the maximum allowed size.")
    finally:
        response.close()

    image_bytes.seek(0)

    try:
        image = Image.open(image_bytes).convert("RGB")
    except Exception as exc:
        raise UnsupportedImageTypeError("Image content could not be decoded.") from exc

    return LoadedImage(
        image=image,
        width=image.width,
        height=image.height,
        content_type=content_type,
    )
