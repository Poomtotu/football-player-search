"""
search_engine.py — Standalone Football Player IR Search Engine
อ่านข้อมูลจาก players.json และค้นหาด้วย Hybrid IR (BM25 + RapidFuzz)

ออกแบบให้ใช้งานเป็น standalone module — ไม่ต้อง import จาก app/ package
เพื่อให้ scraper.py, tests, และ scripts อื่นๆ ใช้ได้โดยตรง

Pipeline:
    query
      │
      ├─► BM25Okapi  (term-frequency ranking)
      │   corpus = name_en×2 + name_th×2 + aliases×2 + team + league + nation
      │
      └─► RapidFuzz WRatio  (fuzzy / typo-tolerant matching)
          เทียบกับ name_en, name_th, aliases, team, league

    combined_score = 0.55 × BM25_norm + 0.45 × Fuzzy_norm
"""

import json
import logging
import os
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from rank_bm25 import BM25Okapi
from rapidfuzz import fuzz

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path Configuration — กำหนด Path ของไฟล์ข้อมูล (players.json)
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "players.json")
MOCK_DATA_PATH = os.path.join(BASE_DIR, "..", "data", "mock_players.json")


# ---------------------------------------------------------------------------
# Config — กำหนดค่าน้ำหนักและ Threshold ของระบบ Search Engine
# ---------------------------------------------------------------------------
# ทำหน้าที่: กำหนดค่าน้ำหนักระหว่าง BM25 และ Fuzzy Search รวมทั้งเกณฑ์ตัดคะแนน
# ทำไปทำไม: เพื่อให้สามารถปรับจูนความแม่นยำ (Precision) และความครอบคลุม (Recall) ของผลการค้นหาได้จากจุดเดียว

BM25_WEIGHT: float = 0.55         # น้ำหนักคะแนน BM25 (55% เน้นความแม่นยำของคำค้นหาแบบตรงตัว)
FUZZY_WEIGHT: float = 0.45        # น้ำหนักคะแนน Fuzzy (45% ช่วยดักจับคำที่พิมพ์ผิดหรือใกล้เคียง)
MIN_FUZZY_SCORE: float = 70.0     # RapidFuzz ขั้นต่ำ 70 (ถ้าต่ำกว่า 70 ให้ตัดทิ้งเป็น 0 ทันที เพื่อกันผลลัพธ์มั่ว)
SHORT_QUERY_LIMIT: int = 3        # คำค้นหา <= 3 ตัวอักษร ให้ใช้เฉพาะ Exact/Substring Match เท่านั้น ห้ามใช้ Fuzzy

# ค่าน้ำหนักความสำคัญของแต่ละ Field ในการทำ Fuzzy Matching
# ทำไปทำไม: ชื่อนักเตะ (name_en, name_th, aliases) มีความสำคัญสูงสุด รองลงมาคือสโมสร ลีก และทีมชาติ
_FUZZY_FIELD_WEIGHTS: dict[str, float] = {
    "name_en":        1.0,
    "name_th":        1.0,
    "aliases":        1.0,
    "current_team":   0.8,
    "current_league": 0.6,
    "nation":         0.5,
}


# ---------------------------------------------------------------------------
# Text Utilities — ฟังก์ชันแปลงและจัดการข้อความ
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """
    ทำหน้าที่: ทำความสะอาดข้อความด้วย Unicode NFKC, ปรับเป็นตัวพิมพ์เล็ก (lowercase) และตัดช่องว่าง
    ทำไปทำไม: เพื่อให้การเปรียบเทียบข้อความ (เช่น 'Messi', 'messi', 'MESSI') มองเป็นคำเดียวกัน
    """
    if not text:
        return ""
    return unicodedata.normalize("NFKC", str(text)).lower().strip()


def _tokenize(text: str) -> list[str]:
    """
    ทำหน้าที่: ตัดประโยคออกเป็น Tokens (คำย่อย) โดยใช้ whitespace
    ทำไปทำไม: เพื่อเตรียม Corpus Document สำหรับนำไปป้อนให้อัลกอริทึม BM25 คำนวณความถี่คำ (Term Frequency)
    """
    return [t for t in _normalize(text).split() if t]


# ---------------------------------------------------------------------------
# Internal Data Structure — โครงสร้างข้อมูลสำหรับ Index
# ---------------------------------------------------------------------------

@dataclass
class _IndexEntry:
    """
    ทำหน้าที่: โครงสร้างข้อมูลที่เก็บข้อมูลที่ Preprocess ไว้ล่วงหน้าของนักเตะแต่ละคน
    ทำไปทำไม: ช่วยให้การค้นหาทั้ง BM25 และ Fuzzy Match ทำงานได้เร็วระดับมิลลิวินาที โดยไม่ต้องคำนวณซ้ำทุกรอบ
    """
    raw: dict[str, Any]                  # original dict จาก players.json
    tokens: list[str]                    # tokenized document สำหรับ BM25
    fuzzy_targets: dict[str, list[str]]  # field → list[str] สำหรับ fuzzy
    name_en_norm: str = ""               # normalized name_en
    name_th_norm: str = ""               # normalized name_th
    aliases_norm: list[str] = field(default_factory=list)  # normalized aliases
    team_norm: str = ""                  # normalized team
    league_norm: str = ""                # normalized league
    nation_norm: str = ""                # normalized national team


def _build_entry(player: dict[str, Any]) -> _IndexEntry:
    """
    ทำหน้าที่: แปลง Dict ข้อมูลนักเตะ 1 คนให้อยู่ในรูป _IndexEntry
    - สร้าง BM25 Document พร้อมเทคนิค Implicit Boosting (เพิ่มคำซ้ำ 2 เท่าในชื่อไทย, อังกฤษ, และฉายา)
    - เตรียม Normalized Strings สำหรับทำ Exact/Substring Match ทันที
    ทำไปทำไม: ให้ความสำคัญกับชื่อและฉายาของนักเตะมากกว่าสโมสรหรือลีกเมื่อค้นหาด้วย BM25
    """
    name_en = player.get("name_en", "")
    name_th = player.get("name_th", "")
    aliases = player.get("aliases", [])
    team = player.get("current_team", "")
    league = player.get("current_league", "")
    nation = player.get("national_team", {}).get("team_name", "")

    # BM25 corpus document: ทำ Implicit Boosting โดยการใส่ชื่อและฉายาซ้ำ 2 รอบ
    bm25_doc = " ".join([
        name_en, name_en,        # boost ×2
        name_th, name_th,        # boost ×2
        " ".join(aliases), " ".join(aliases),  # boost ×2
        team, league, nation,
    ])

    fuzzy_targets: dict[str, list[str]] = {
        "name_en":        [name_en] if name_en else [],
        "name_th":        [name_th] if name_th else [],
        "aliases":        [a for a in aliases if a],
        "current_team":   [team] if team and team != "N/A" else [],
        "current_league": [league] if league and league != "N/A" else [],
        "nation":         [nation] if nation and nation != "N/A" else [],
    }

    return _IndexEntry(
        raw=player,
        tokens=_tokenize(bm25_doc),
        fuzzy_targets=fuzzy_targets,
        name_en_norm=_normalize(name_en),
        name_th_norm=_normalize(name_th),
        aliases_norm=[_normalize(a) for a in aliases if a],
        team_norm=_normalize(team),
        league_norm=_normalize(league),
        nation_norm=_normalize(nation),
    )


# ---------------------------------------------------------------------------
# FootballSearchEngine
# ---------------------------------------------------------------------------

class FootballSearchEngine:
    """
    Hybrid IR Search Engine สำหรับค้นหาข้อมูลนักเตะฟุตบอล

    ฟีเจอร์:
    1. Exact & Substring Match First: หากคำค้นหาตรงกับ name_th, name_en, aliases ให้ score = 1.0 (100) ทันที
    2. Adjust Fuzzy Search Threshold: RapidFuzz ใช้ Threshold ขั้นต่ำ >= 70 (ต่ำกว่า 70 ตัดทิ้งเป็น 0)
    3. Short Query Protection: คำค้นหา <= 3 ตัวอักษร ใช้เฉพาะ Exact/Substring Match ไม่ใช้ Fuzzy
    4. Sort & Filter: เรียงตาม relevance_score มากไปน้อย และตัดรายการที่ score = 0 ออก
    """

    def __init__(self) -> None:
        self._entries: list[_IndexEntry] = []
        self._bm25: BM25Okapi | None = None
        self._ready: bool = False

    # ------------------------------------------------------------------
    # Factory
    # ------------------------------------------------------------------

    @classmethod
    def from_file(cls, path: str | Path | None = None) -> "FootballSearchEngine":
        """Convenience factory: โหลด + build index ในขั้นตอนเดียว"""
        engine = cls()
        engine.load(path)
        return engine

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def is_ready(self) -> bool:
        return self._ready

    @property
    def player_count(self) -> int:
        return len(self._entries)

    @property
    def players(self) -> list[dict[str, Any]]:
        """คืน list ของ raw player dicts ทั้งหมด"""
        return [e.raw for e in self._entries]

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self, path: str | Path | None = None) -> None:
        """
        โหลดข้อมูลจาก players.json และสร้าง BM25 index

        Args:
            path: path ไปยัง players.json (ถ้าไม่ระบุ จะใช้ DATA_PATH หรือ MOCK_DATA_PATH อัตโนมัติ)
        """
        if path is None:
            if os.path.exists(DATA_PATH) and os.path.getsize(DATA_PATH) > 2:
                path = DATA_PATH
            elif os.path.exists(MOCK_DATA_PATH):
                path = MOCK_DATA_PATH
            else:
                path = DATA_PATH

        target_path = Path(path)
        if not target_path.exists():
            raise FileNotFoundError(
                f"ไม่พบไฟล์: {target_path}\n"
                "โปรดรัน 'python scraper.py' เพื่อสร้าง players.json ก่อน"
            )

        logger.info("กำลังโหลด: %s", target_path)
        with target_path.open(encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError(f"players.json ต้องเป็น JSON array ไม่ใช่ {type(data)}")

        if not data:
            logger.warning("คำเตือน: ไฟล์ %s ว่างเปล่า (ไม่มีข้อมูลนักเตะ)", target_path)

        self._build_index(data)
        logger.info("โหลดสำเร็จ: %d นักเตะ | index พร้อมแล้ว ✓", self.player_count)

    def _build_index(self, players: list[dict[str, Any]]) -> None:
        """สร้าง BM25 index และ preprocess fuzzy targets"""
        self._entries = [_build_entry(p) for p in players]
        corpus = [e.tokens for e in self._entries]

        # BM25Okapi: k1=1.5 (term saturation), b=0.75 (length normalization)
        self._bm25 = BM25Okapi(corpus, k1=1.5, b=0.75)
        self._ready = True

    # ------------------------------------------------------------------
    # Scoring Helpers
    # ------------------------------------------------------------------

    def _bm25_scores(self, query: str) -> list[float]:
        """คำนวณ BM25 raw scores สำหรับ query"""
        assert self._bm25 is not None
        tokens = _tokenize(query)
        if not tokens:
            return [0.0] * len(self._entries)
        return list(self._bm25.get_scores(tokens))

    def _fuzzy_score_one(self, query: str, entry: _IndexEntry) -> float:
        """
        คำนวณ fuzzy score สำหรับนักเตะ 1 คน
        ใช้ WRatio (Weighted Ratio) กับแต่ละ field
        """
        best = 0.0
        for field_name, targets in entry.fuzzy_targets.items():
            w = _FUZZY_FIELD_WEIGHTS.get(field_name, 0.5)
            for target in targets:
                if not target or target == "N/A":
                    continue
                score = fuzz.WRatio(query, target, processor=_normalize)
                weighted = score * w
                if weighted > best:
                    best = weighted
        return best

    # ------------------------------------------------------------------
    # Public Search Interface
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.0,
    ) -> list[dict[str, Any]]:
        """
        ค้นหานักเตะด้วย Hybrid IR ปรับปรุงใหม่

        ข้อกำหนด:
        1. Exact & Substring Match First -> relevance_score = 1.0 (100) ทันที
        2. RapidFuzz Minimum Threshold >= 70 (ต่ำกว่า 70 ตัดออกเป็น 0)
        3. Short Query Protection (<= 3 ตัวอักษร) -> เฉพาะ Exact/Substring Match เท่านั้น ห้ามใช้ Fuzzy
        4. Sort & Filter -> เรียงลำดับจากมากไปน้อย และตัด score = 0 ออก

        Args:
            query:     คำค้นหา
            limit:     จำนวนผลลัพธ์สูงสุด
            threshold: คะแนน relevance ขั้นต่ำ (0.0–1.0)

        Returns:
            list[dict]: รายการนักเตะพร้อม relevance_score
        """
        if not self._ready:
            raise RuntimeError("ต้องเรียก load() หรือ from_file() ก่อน")

        if not query or not query.strip():
            return []

        q_clean = query.strip()
        q_norm = _normalize(q_clean)
        if not q_norm:
            return []

        is_short = len(q_clean) <= SHORT_QUERY_LIMIT

        # คำนวณ BM25
        bm25_raw = self._bm25_scores(q_clean)
        bm25_max = max(bm25_raw, default=0.0)

        results: list[dict[str, Any]] = []

        for i, entry in enumerate(self._entries):
            score = 0.0

            # -----------------------------------------------------------
            # 1. Exact & Substring Match First:
            # -----------------------------------------------------------
            # เช็คว่า query ตรงกับหรืออยู่ใน name_th, name_en หรือ aliases
            if (
                q_norm == entry.name_th_norm
                or q_norm == entry.name_en_norm
                or (len(q_norm) >= 2 and (q_norm in entry.name_th_norm or q_norm in entry.name_en_norm))
                or any(q_norm == a or (len(q_norm) >= 2 and q_norm in a) for a in entry.aliases_norm)
            ):
                score = 1.0
            # เช็คว่า query ตรงกับทีม, ลีก หรือประเทศ
            elif (
                q_norm == entry.team_norm
                or (len(q_norm) >= 3 and q_norm in entry.team_norm)
                or q_norm == entry.league_norm
                or (len(q_norm) >= 4 and q_norm in entry.league_norm)
                or q_norm == entry.nation_norm
                or (len(q_norm) >= 3 and q_norm in entry.nation_norm)
            ):
                score = 1.0
            elif is_short:
                # -------------------------------------------------------
                # 3. Short Query Protection (len <= 3):
                # -------------------------------------------------------
                # ห้ามใช้ Fuzzy Search ป้องกันการจับคู่มั่ว
                score = 0.0
            else:
                # -------------------------------------------------------
                # 2. Adjust Fuzzy Search Threshold (>= 70):
                # -------------------------------------------------------
                raw_fuzzy = self._fuzzy_score_one(q_clean, entry)
                if raw_fuzzy >= MIN_FUZZY_SCORE:
                    fuzzy_norm = raw_fuzzy / 100.0
                    b_norm = (bm25_raw[i] / bm25_max) if bm25_max > 0.0 and bm25_raw[i] > 0.0 else 0.0
                    if b_norm > 0.0:
                        score = round(BM25_WEIGHT * b_norm + FUZZY_WEIGHT * fuzzy_norm, 4)
                    else:
                        score = round(fuzzy_norm, 4)
                else:
                    score = 0.0

            # -----------------------------------------------------------
            # 4. Filter: ตัดรายการที่ score = 0 ออก
            # -----------------------------------------------------------
            if score > 0.0 and score >= threshold:
                result = dict(entry.raw)
                result["relevance_score"] = score
                results.append(result)

        # เรียงลำดับตาม relevance_score จากมากไปน้อย
        results.sort(key=lambda r: r["relevance_score"], reverse=True)
        return results[:limit]
