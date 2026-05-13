import logging
import sys


def configure_logging(env: str) -> logging.Logger:
    logger = logging.getLogger("ai_service")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
        )
        logger.addHandler(handler)

    if env == "test":
        logger.disabled = True

    return logger


def log_request(
    logger: logging.Logger,
    *,
    endpoint: str,
    provider: str,
    model_version: str,
    duration_ms: float,
) -> None:
    logger.info(
        "endpoint=%s provider=%s modelVersion=%s durationMs=%.2f",
        endpoint,
        provider,
        model_version,
        duration_ms,
    )
