"""
models.py — Pydantic v2 Data Models
ใช้ Type Hinting ครบทุก field เพื่อ validation อัตโนมัติและ auto-generated OpenAPI docs
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-models (Nested Objects)
# ---------------------------------------------------------------------------

class NationalTeamInfo(BaseModel):
    """ข้อมูลการเล่นให้ทีมชาติ"""

    played: bool = Field(..., description="เคยลงเล่นให้ทีมชาติหรือไม่")
    team_name: str = Field(..., description="ชื่อทีมชาติ เช่น Argentina, Brazil")
    caps: int = Field(..., ge=0, description="จำนวนครั้งที่ลงเล่นให้ทีมชาติ")
    goals: int = Field(..., ge=0, description="จำนวนประตูที่ทำได้ให้ทีมชาติ")


class PlayerStats(BaseModel):
    """สถิติรวมตลอดอาชีพ"""

    total_goals: int = Field(..., ge=0, description="ประตูรวมตลอดอาชีพ")
    total_assists: int = Field(..., ge=0, description="แอสซิสต์รวมตลอดอาชีพ")
    trophies_count: int = Field(..., ge=0, description="จำนวนถ้วยรางวัลที่ได้รับ")


# ---------------------------------------------------------------------------
# Core Player Model (ตรงตาม mock_players.json)
# ---------------------------------------------------------------------------

class Player(BaseModel):
    """ข้อมูลนักฟุตบอลเต็มรูปแบบ"""

    id: int = Field(..., description="รหัสนักเตะ (unique)")
    name_en: str = Field(..., description="ชื่อภาษาอังกฤษ")
    name_th: str = Field(..., description="ชื่อภาษาไทย")
    aliases: list[str] = Field(default_factory=list, description="ฉายา / ชื่อเล่น เช่น เมสซี่, LM10")
    bio: str = Field(default="", description="ประวัติย่อนักเตะ")
    social_links: dict[str, str] = Field(default_factory=dict, description="ช่องทางติดตามทาง Social Media")
    age: int = Field(..., ge=0, le=100, description="อายุ")
    photo_url: str = Field(..., description="URL รูปภาพนักเตะ")
    club_logo_url: str = Field(default="https://placehold.co/80x80?text=Club", description="URL โลโก้สโมสร")
    flag_url: str = Field(default="https://flagcdn.com/w80/un.png", description="URL รูปธงชาติ")
    current_league: str = Field(..., description="ลีกที่เล่นอยู่ปัจจุบัน")
    current_team: str = Field(..., description="ทีมที่เล่นอยู่ปัจจุบัน")
    nickname: str | None = Field(default=None)
    birth_date: str | None = Field(default=None)
    height_cm: int | None = Field(default=None, ge=100, le=230)
    weight_kg: float | None = Field(default=None, ge=35, le=160)
    residence: str | None = Field(default=None)
    primary_position: str | None = Field(default=None)
    secondary_positions: list[str] = Field(default_factory=list)
    preferred_foot: str | None = Field(default=None)
    shirt_number: int | None = Field(default=None, ge=1, le=99)
    profile_summary: str | None = Field(default=None)
    strengths: list[str] = Field(default_factory=list)
    teams_history: list[str] = Field(
        default_factory=list,
        description="ประวัติสโมสรที่เคยเล่น (เรียงตามลำดับเวลา)"
    )
    national_team: NationalTeamInfo = Field(..., description="ข้อมูลทีมชาติ")
    stats: PlayerStats = Field(..., description="สถิติรวมตลอดอาชีพ")


# ---------------------------------------------------------------------------
# API Response Models
# ---------------------------------------------------------------------------

class PlayerSearchResult(Player):
    """
    Player พร้อม relevance_score จาก IR engine
    สืบทอดทุก field ของ Player และเพิ่ม relevance_score
    """

    relevance_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="คะแนนความเกี่ยวข้อง (0.0–1.0) จาก BM25 + Fuzzy Search"
    )


class SearchResponse(BaseModel):
    """Response wrapper สำหรับ /api/players/search"""

    query: str = Field(..., description="คำค้นหาที่ส่งมา")
    total: int = Field(..., ge=0, description="จำนวนผลลัพธ์ที่พบ")
    results: list[PlayerSearchResult] = Field(..., description="รายการนักเตะเรียงตาม relevance_score")


class PlayersListResponse(BaseModel):
    """Response wrapper สำหรับ /api/players"""

    total: int = Field(..., ge=0, description="จำนวนนักเตะทั้งหมด")
    players: list[Player] = Field(..., description="รายการนักเตะทั้งหมด")


class HealthResponse(BaseModel):
    """Response สำหรับ health check endpoint"""

    status: str = Field(..., description="สถานะของ service")
    players_loaded: int = Field(..., description="จำนวนนักเตะที่โหลดเข้าระบบ")
    index_ready: bool = Field(..., description="IR index พร้อมใช้งานหรือไม่")


# ---------------------------------------------------------------------------
