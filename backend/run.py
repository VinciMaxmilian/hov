"""Atalho de desenvolvimento: `python run.py` a partir de backend/ (ou de qualquer lugar)."""

import os
import sys
from pathlib import Path

import uvicorn

ROOT = Path(__file__).resolve().parent

if __name__ == "__main__":
    os.chdir(ROOT)  # .env é lido do diretório atual
    sys.path.insert(0, str(ROOT))
    uvicorn.run("app.main:app", host="127.0.0.1", port=int(os.environ.get("PORT", "8000")), reload=True, app_dir=str(ROOT))
