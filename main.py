"""
RayMusic - Backend FastAPI
"""

import os
import json
import asyncio
import re
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

TMP_DIR = Path("/tmp")
TMP_DIR.mkdir(exist_ok=True)

# ─── Archivos estáticos ───────────────────────────────────────────────────────
app.mount("/imagenes", StaticFiles(directory="imagenes"), name="imagenes")

@app.get("/styles.css")
def serve_css():
    return FileResponse("styles.css", media_type="text/css")

@app.get("/app.js")
def serve_js():
    return FileResponse("app.js", media_type="application/javascript")

@app.get("/config.js")
def serve_config():
    return FileResponse("config.js", media_type="application/javascript")

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}

# ─── API Key ──────────────────────────────────────────────────────────────────
@app.get("/api/key")
def get_api_key():
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="YOUTUBE_API_KEY no configurada")
    return {"apiKey": api_key}

# ─── Raíz ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return FileResponse("index.html")
