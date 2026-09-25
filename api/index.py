"""Vercel entrypoint for the Football Player IR FastAPI backend."""

import os
from pathlib import Path
import sys
import tempfile

# Vercel's deployment filesystem is read-only except for /tmp.
# PyThaiNLP creates its corpus metadata/cache directory during import, so
# point it at a writable temporary directory before importing the backend.
os.environ.setdefault(
    "PYTHAINLP_DATA",
    str(Path(tempfile.gettempdir()) / "pythainlp-data"),
)

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402
