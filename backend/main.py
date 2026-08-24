"""
main.py — Backend Entry Point for FastAPI application
Run from backend/ directory:
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    python main.py
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
