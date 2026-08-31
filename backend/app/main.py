# ===========================================================================
# main.py — FastAPI Application Entry Point & REST API Endpoints
# ===========================================================================
# ไฟล์นี้ทำหน้าที่เป็นหัวใจหลักของฝั่งเซิร์ฟเวอร์ (Backend Server)
# ประกอบด้วย:
# 1. การตั้งค่าแอปพลิเคชัน FastAPI พร้อมสร้าง Swagger API Documentation อัตโนมัติ
# 2. ติดตั้ง CORSMiddleware เพื่อให้ React Frontend สามารถเรียกใช้งานข้าม Cross-Origin
# 3. การจัดการวงจรชีวิต (Lifespan) เพื่อโหลดข้อมูลนักเตะและเตรียม IR Index ก่อนรับ Request แรก
# 4. ให้บริการ REST API Endpoints (/health, /api/players, /api/players/search, /api/players/{id})
# ===========================================================================

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# รองรับการ import ทั้งการรันจากภายใน package และรันตรงจากภายนอก
try:
    from app.models import (
        HealthResponse,
        Player,
        PlayersListResponse,
        SearchResponse,
    )
    from app.search_engine import FootballSearchEngine
except ImportError:
    from models import (
        HealthResponse,
        Player,
        PlayersListResponse,
        SearchResponse,
    )
    from search_engine import FootballSearchEngine

# ---------------------------------------------------------------------------
# 1. การตั้งค่าระบบ Logging และ Path ไฟล์ข้อมูล (Path & Logging Configuration)
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "players.json")
MOCK_DATA_PATH = os.path.join(BASE_DIR, "..", "data", "mock_players.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 2. อินสแตนซ์ของ Search Engine (Global IR Search Engine Instance)
# ---------------------------------------------------------------------------
# ทำหน้าที่: สร้าง Object สำหรับประมวลผลการค้นหาด้วยอัลกอริทึม BM25 + RapidFuzz
# ทำไปทำไม: เพื่อใช้อินสแตนซ์ร่วมกันทั้งแอปพลิเคชัน ไม่ต้องสร้างดัชนีค้นหาใหม่ทุกครั้งที่มี Request เข้ามา
search_engine = FootballSearchEngine()


# ---------------------------------------------------------------------------
# 3. การจัดการวงจรชีวิตแอปพลิเคชัน (Lifespan Management)
# ---------------------------------------------------------------------------
# ทำหน้าที่: โหลดไฟล์ข้อมูลนักเตะ players.json และเตรียม Index ของระบบ IR ทันทีที่สตาร์ตเซิร์ฟเวอร์
# ทำไปทำไม: เพื่อให้ระบบค้นหาพร้อมทำงานทันที เมื่อผู้ใช้ส่ง Request มาค้นหา จะไม่ต้องเสียเวลาอ่านไฟล์ซ้ำ
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup Task: โหลดข้อมูลนักเตะและสร้างดัชนีค้นหา (BM25 + RapidFuzz Index)
    """
    logger.info("🚀 กำลังเริ่มต้น Football Player IR API...")

    # เลือกระหว่างไฟล์จริง players.json หรือ mock data สำรอง
    if os.path.exists(DATA_PATH) and os.path.getsize(DATA_PATH) > 2:
        data_path = DATA_PATH
    elif os.path.exists(MOCK_DATA_PATH):
        data_path = MOCK_DATA_PATH
    else:
        raise FileNotFoundError(
            f"ไม่พบไฟล์ข้อมูล: {DATA_PATH} หรือ {MOCK_DATA_PATH}\n"
            "โปรดรัน 'python scraper.py' เพื่อสร้าง players.json ก่อน"
        )

    logger.info("กำลังโหลดข้อมูลนักเตะจาก: %s", data_path)
    search_engine.load(data_path)
    logger.info("✅ ระบบ IR พร้อมทำงาน — ข้อมูลนักเตะ %d คน", search_engine.player_count)

    yield  # เซิร์ฟเวอร์เปิดให้บริการจนกว่าจะปิด

    logger.info("🛑 ปิดการทำงาน Football Player IR API")



# ---------------------------------------------------------------------------
# 4. การสร้างแอปพลิเคชัน FastAPI (FastAPI App Initialization)
# ---------------------------------------------------------------------------
# ทำหน้าที่: กำหนดค่าแอปพลิเคชันหลัก ชื่อบริการ คำอธิบาย และเปิดใช้งาน Swagger UI (/docs)
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
# 5. การตั้งค่า CORS (Cross-Origin Resource Sharing Middleware)
# ---------------------------------------------------------------------------
# ทำหน้าที่: อนุญาตให้ Frontend (เช่น React พอร์ต 3000 หรือจากโดเมนอื่น) สามารถยิง API มายัง Backend
# ทำไปทำไม: ป้องกันปัญหาเบราว์เซอร์บล็อกการรับส่งข้อมูลข้าม Domain/Port (CORS Block Error)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],        # อนุญาตทุก HTTP Method (GET, POST ฯลฯ)
    allow_headers=["*"],        # อนุญาตทุก HTTP Header
)


# ---------------------------------------------------------------------------
# 6. ระบบจัดการข้อผิดพลาดระดับส่วนกลาง (Global Exception Handler)
# ---------------------------------------------------------------------------
# ทำหน้าที่: ดักจับ Error ที่ไม่ได้คาดคิดทั้งหมดในระบบ แล้วส่งคืนเป็น JSON พร้อม HTTP status 500
# ทำไปทำไม: ป้องกันไม่ให้เซิร์ฟเวอร์ล่ม (Crash) และช่วยให้ฝั่งหน้าบ้านได้รับข้อความแจ้งเตือนที่เข้าใจได้
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
# 7. REST API Endpoints
# ---------------------------------------------------------------------------

# --- Endpoint 7.1: /health (Health Check API) ---
# ทำหน้าที่: ส่งคืนสถานะความพร้อมของบริการและจำนวนนักเตะที่อยู่ในดัชนี
# ทำไปทำไม: ให้ฝั่ง Frontend ใช้เช็กว่า Backend สตาร์ตเสร็จหรือยังก่อนจะยิงคำสั่งค้นหา
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


# --- Endpoint 7.2: /api/players (ดึงข้อมูลนักเตะทั้งหมด) ---
# ทำหน้าที่: ส่งคืนรายชื่อนักเตะทั้งหมดในระบบโดยไม่กรองใดๆ
# ทำไปทำไม: ใช้ตอนโหลดหน้าครั้งแรก เพื่อแสดงผลนักเตะทั้งหมดก่อนที่ผู้ใช้จะเริ่มพิมพ์ค้นหา
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


# --- Endpoint 7.2.1: /api/reload (รีโหลดข้อมูล JSON และเตรียม Index ใหม่ทันที) ---
@app.post(
    "/api/reload",
    tags=["System"],
    summary="Reload Players Data",
    description="รีโหลดไฟล์ข้อมูลนักเตะและสร้างดัชนี BM25 + RapidFuzz ใหม่ทันทีโดยไม่ต้องรีสตาร์ตเซิร์ฟเวอร์",
)
async def reload_data():
    if os.path.exists(DATA_PATH) and os.path.getsize(DATA_PATH) > 2:
        data_path = DATA_PATH
    elif os.path.exists(MOCK_DATA_PATH):
        data_path = MOCK_DATA_PATH
    else:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์ข้อมูลนักเตะ")
    
    search_engine.load(data_path)
    logger.info("♻️ รีโหลดข้อมูลนักเตะสำเร็จ: %d คน", search_engine.player_count)
    return {
        "status": "ok",
        "message": f"รีโหลดข้อมูลนักเตะสำเร็จ {search_engine.player_count} คน",
        "players_loaded": search_engine.player_count,
    }



# --- Endpoint 7.3: /api/players/search (ค้นหาด้วย Hybrid IR) ---
# ทำหน้าที่: รับคำค้นหา (query) แล้วส่งผ่านไปยัง FootballSearchEngine
#            ผลลัพธ์จะเรียงตาม relevance_score (BM25 55% + Fuzzy 45%) จากมากไปน้อย
# ทำไปทำไม: เป็น API หลักที่ Frontend เรียกใช้เมื่อผู้ใช้พิมพ์คำค้นหา
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
            description="คำค้นหา เช่น 'เมสซี่', 'messi', 'CR7', 'LM10', 'ฮาลันด์', 'messy' (พิมพ์ผิดก็ค้นหาได้)",
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
    # ตรวจสอบว่า IR Index พร้อมใช้งานก่อนเริ่มค้นหา
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


# --- Endpoint 7.4: /api/players/{player_id} (ดึงข้อมูลนักเตะตาม ID) ---
# ทำหน้าที่: ค้นหาและส่งคืนข้อมูลนักเตะรายบุคคลจาก ID ที่ระบุ
# ทำไปทำไม: ใช้เมื่อต้องการดูรายละเอียดนักเตะคนใดคนหนึ่งโดยตรง
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
# 8. การเสิร์ฟ Frontend SPA (Static Single-Page Application Serving)
# ---------------------------------------------------------------------------
# ทำหน้าที่: เสิร์ฟไฟล์ HTML/CSS/JS ของ React ที่ build แล้ว (dist/) จาก Backend โดยตรง
# ทำไปทำไม: ให้ deploy ครั้งเดียวได้เลย ไม่ต้องแยก Web Server สำหรับ Frontend
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_dir = os.path.join(BASE_DIR, "..", "..", "frontend", "dist")
if os.path.exists(dist_dir):
    # Mount folder assets (CSS, JS, รูปภาพ) ให้เข้าถึงได้ที่ /assets/...
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # ข้ามถ้าเป็น path ของ api, health, หรือ docs เพื่อไม่ให้ทับ API routes
        # Never let the SPA fallback swallow unknown API/documentation routes.
        if (
            full_path.startswith("api/")
            or full_path in {"health", "docs", "openapi.json", "redoc"}
            or full_path.startswith("docs/")
        ):
            raise HTTPException(status_code=404, detail="Not Found")
        # ถ้ามีไฟล์จริง (เช่น favicon.ico) ให้ส่งไฟล์นั้นตรงๆ
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # ถ้าไม่มีไฟล์ ให้ส่ง index.html (SPA routing จัดการเอง)
        return FileResponse(os.path.join(dist_dir, "index.html"))

