"""
main.py — FastAPI Application Entry Point for Football Player IR API
ระบบค้นหาประวัตินักฟุตบอลด้วย Hybrid IR (BM25 + RapidFuzz)
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    HealthResponse,
    Player,
    PlayersListResponse,
    SearchResponse,
)
from search_engine import FootballSearchEngine

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global Search Engine Instance
# ---------------------------------------------------------------------------
search_engine = FootballSearchEngine()


# ---------------------------------------------------------------------------
# Lifespan Management
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: โหลด players.json (หรือ fallback ไปที่ data/mock_players.json)
    และสร้าง Hybrid IR Index (BM25 + RapidFuzz)
    """
    logger.info("🚀 กำลังเริ่มต้น Football Player IR API...")

    root_dir = Path(__file__).parent.parent
    players_json = root_dir / "players.json"
    mock_json = root_dir / "data" / "mock_players.json"

    if players_json.exists():
        data_path = players_json
    elif mock_json.exists():
        data_path = mock_json
    else:
        raise FileNotFoundError("ไม่พบไฟล์ players.json หรือ data/mock_players.json")

    logger.info("กำลังโหลดข้อมูลนักเตะจาก: %s", data_path)
    search_engine.load(data_path)
    logger.info("✅ ระบบ IR พร้อมทำงาน — ข้อมูลนักเตะ %d คน", search_engine.player_count)

    yield

    logger.info("🛑 ปิดการทำงาน Football Player IR API")


# ---------------------------------------------------------------------------
# FastAPI App Initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Football Player IR API",
    description=(
        "ระบบค้นหาประวัตินักฟุตบอลด้วย Hybrid Information Retrieval (BM25 + RapidFuzz)\n\n"
        "✨ **ฟีเจอร์เด่น:**\n"
        "- ค้นหาได้ทั้งภาษาไทย, ภาษาอังกฤษ, และฉายา (เช่น 'เมสซี่', 'CR7', 'LM10', 'จอมมารบลู')\n"
        "- รองรับการพิมพ์ผิด (Typo-Tolerant ด้วย RapidFuzz WRatio)\n"
        "- ให้คะแนน relevance_score จากการผสมผสาน BM25 (55%) และ Fuzzy Search (45%)\n"
        "- ข้อมูลนักเตะกว่า 100 คนพร้อมรูปภาพ สโมสร และสถิติตลอดอาชีพ"
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Configuration (สำหรับเชื่อมต่อ Frontend)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handlers
# ---------------------------------------------------------------------------
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("เกิดข้อผิดพลาดในการประมวลผล request %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง",
            "detail": str(exc),
            "path": str(request.url.path),
        },
    )



# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health Check",
    description="ตรวจสอบสถานะการทำงานของ API และ IR Index",
)
@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["System"],
    include_in_schema=False,
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        players_loaded=search_engine.player_count,
        index_ready=search_engine.is_ready,
    )


@app.get(
    "/api/players",
    response_model=PlayersListResponse,
    tags=["Players"],
    summary="Get All Players",
    description="ดึงรายชื่อนักเตะทั้งหมดในระบบ",
)
async def get_all_players() -> PlayersListResponse:
    players = search_engine.players
    return PlayersListResponse(total=len(players), players=players)


@app.get(
    "/api/players/search",
    response_model=SearchResponse,
    tags=["Players"],
    summary="Search Players (Hybrid IR)",
    description=(
        "ค้นหาประวัตินักเตะด้วย Hybrid Information Retrieval\n\n"
        "คำนวณคะแนน `relevance_score` อัตโนมัติจาก BM25 + RapidFuzz"
    ),
)
async def search_players(
    q: Annotated[
        str,
        Query(
            min_length=1,
            max_length=200,
            description="คำค้นหา เช่น 'เมสซี่', 'messi', 'CR7', 'LM10', 'ฮาลันด์', 'messy' (พิมพ์ผิดได้)",
            example="เมสซี่",
        ),
    ],
    limit: Annotated[
        int,
        Query(ge=1, le=100, description="จำนวนผลลัพธ์สูงสุดที่ต้องการ"),
    ] = 10,
    threshold: Annotated[
        float,
        Query(ge=0.0, le=1.0, description="คะแนน relevance_score ขั้นต่ำ (0.0-1.0)"),
    ] = 0.0,
) -> SearchResponse:
    if not search_engine.is_ready:
        raise HTTPException(
            status_code=503,
            detail="ระบบค้นหา (IR Index) ยังไม่พร้อมใช้งาน กรุณารอสักครู่",
        )

    results = search_engine.search(query=q, limit=limit, threshold=threshold)

    return SearchResponse(
        query=q,
        total=len(results),
        results=results,
    )


@app.get(
    "/api/players/{player_id}",
    response_model=Player,
    tags=["Players"],
    summary="Get Player by ID",
    description="ดึงข้อมูลประวัตินักเตะรายบุคคลตาม ID",
)
async def get_player_by_id(player_id: int) -> Player:
    for p in search_engine.players:
        if p.get("id") == player_id:
            return Player.model_validate(p)

    raise HTTPException(
        status_code=404,
        detail=f"ไม่พบข้อมูลนักเตะ ID={player_id}",
    )


# ---------------------------------------------------------------------------
# Static SPA Frontend Serving
# ---------------------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_dir = Path(__file__).parent.parent / "frontend" / "dist"
if dist_dir.exists():
    if (dist_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=dist_dir / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # ข้ามถ้าเป็น path ของ api หรือ health หรือ docs
        if full_path.startswith("api/") or full_path in ["health", "docs", "openapi.json", "redoc"]:
            raise HTTPException(status_code=404)
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")

