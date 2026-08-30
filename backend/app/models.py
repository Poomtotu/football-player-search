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
    age: int = Field(..., ge=0, le=60, description="อายุ")
    photo_url: str = Field(..., description="URL รูปภาพนักเตะ")
    club_logo_url: str = Field(default="https://placehold.co/80x80?text=Club", description="URL โลโก้สโมสร")
    flag_url: str = Field(default="https://flagcdn.com/w80/un.png", description="URL รูปธงชาติ")
    current_league: str = Field(..., description="ลีกที่เล่นอยู่ปัจจุบัน")
    current_team: str = Field(..., description="ทีมที่เล่นอยู่ปัจจุบัน")
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
# User Profile Models (CRUD)
# ---------------------------------------------------------------------------

class CareerHistoryItem(BaseModel):
    clubName: str = Field(..., description="ชื่อสโมสร")
    years: str = Field(..., description="ปีที่สังกัด เช่น 2019-2022")
    level: str = Field(..., description="ระดับลีก / เยาวชน / อาชีพ")


class HonourItem(BaseModel):
    title: str = Field(..., description="ชื่อรางวัล / แชมป์")
    year: int = Field(..., description="ปีที่ได้รับ")


class PersonalInfo(BaseModel):
    fullName: str = Field(..., description="ชื่อ-นามสกุล")
    dob: str = Field(..., description="วันเกิด (YYYY-MM-DD)")
    height: float = Field(..., ge=0, description="ส่วนสูง (cm)")
    weight: float = Field(..., ge=0, description="น้ำหนัก (kg)")
    nationality: str = Field(..., description="สัญชาติ")


class ContactInfo(BaseModel):
    phone: str = Field(..., description="เบอร์โทรศัพท์")
    email: str = Field(..., description="อีเมล")
    socialLinks: list[str] = Field(default_factory=list, description="ลิงก์ Social Media")
    highlightVideoUrl: str | None = Field(default=None, description="ลิงก์วิดีโอไฮไลท์การเล่น")


class PlayerInfo(BaseModel):
    mainPosition: str = Field(..., description="ตำแหน่งหลัก")
    secondaryPositions: list[str] = Field(default_factory=list, description="ตำแหน่งรอง")


class UserProfileBase(BaseModel):
    personal: PersonalInfo
    contact: ContactInfo
    playerInfo: PlayerInfo
    careerHistory: list[CareerHistoryItem] = Field(default_factory=list)
    honours: list[HonourItem] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    personal: PersonalInfo | None = None
    contact: ContactInfo | None = None
    playerInfo: PlayerInfo | None = None
    careerHistory: list[CareerHistoryItem] | None = None
    honours: list[HonourItem] | None = None
    skills: list[str] | None = None


class UserProfileResponse(UserProfileBase):
    id: str = Field(..., description="รหัสโปรไฟล์")

