"""
search_engine.py — Standalone Football Player IR Search Engine
อ่านข้อมูลจาก players.json และค้นหาด้วย Hybrid IR
(BM25 + RapidFuzz + Levenshtein + Jaccard) พร้อม Thai Word Segmentation ด้วย PyThaiNLP

ออกแบบให้ใช้งานเป็น standalone module — ไม่ต้อง import จาก app/ package
เพื่อให้ scraper.py, tests, และ scripts อื่นๆ ใช้ได้โดยตรง

Pipeline:
    query
      │
      ├─► Exact / Alias / Thai pronunciation match
      ├─► Structured substring match (name / team / league / nation)
      ├─► BM25Okapi  (term-frequency ranking)
      │   corpus = name_en×2 + name_th×2 + aliases×2 + team + league + nation
      │
      └─► Hybrid lexical similarity
          ├─ RapidFuzz WRatio
          ├─ Levenshtein edit-distance percentage
          └─ Jaccard token similarity (PyThaiNLP/newmm สำหรับภาษาไทย)

    final relevance = deterministic direct-match score
      หรือ 0.55 × BM25_norm + 0.45 × HybridLexical
    MATCH บน UI = match-type-aware descriptive relevance
    (แยกจาก ranking score และไม่ใช่ probability/accuracy)
"""

import json
import logging
import math
import os
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from pythainlp.tokenize import word_tokenize
from rank_bm25 import BM25Okapi
from rapidfuzz import fuzz
from rapidfuzz.distance import Levenshtein

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
DEFAULT_RESULT_THRESHOLD: float = 0.60  # จาก evaluation set: ตัด noise โดยไม่ลด recall ของชุดทดสอบ

# น้ำหนักภายใน lexical similarity:
# - WRatio รับมือคำสลับ/บางส่วน/typo ได้ดี
# - Levenshtein ให้สูตร edit-distance ตามนิยามโดยตรง
# - Jaccard ช่วย query หลายคำและภาษาไทยหลัง tokenization
WRATIO_SIGNAL_WEIGHT: float = 0.55
LEVENSHTEIN_SIGNAL_WEIGHT: float = 0.30
JACCARD_SIGNAL_WEIGHT: float = 0.15
MIN_JACCARD_SCORE: float = 0.34  # ต้องมี token overlap อย่างมีนัยสำคัญ

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

# Centralized club aliases. These are common, specific aliases only.
# team_variants maps the canonical club name to spellings that actually occur in players.json.
CLUB_ALIAS_GROUPS: dict[str, dict[str, tuple[str, ...]]] = {
    "manchester city": {
        "aliases": ("man city", "mcfc"),
        "team_variants": ("manchester city",),
    },
    "manchester united": {
        "aliases": ("man utd", "man united", "mufc"),
        "team_variants": ("manchester united",),
    },
    "paris saint-germain": {
        "aliases": ("psg",),
        "team_variants": ("paris saint-germain", "paris sg"),
    },
    "barcelona": {
        "aliases": ("barca", "barça", "fcb"),
        "team_variants": ("barcelona", "fc barcelona"),
    },
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


def _resolve_club_alias(query_norm: str) -> str | None:
    """Return a canonical club name only for a known, specific alias."""
    for canonical, group in CLUB_ALIAS_GROUPS.items():
        if query_norm in group["aliases"]:
            return canonical
    return None


def _team_matches_resolved_alias(team_norm: str, canonical: str) -> bool:
    group = CLUB_ALIAS_GROUPS.get(canonical)
    if not group:
        return team_norm == canonical
    return team_norm in group["team_variants"]


def _canonical_team_identity(team_norm: str) -> str:
    """Collapse known spelling variants/aliases to one club identity."""
    for canonical, group in CLUB_ALIAS_GROUPS.items():
        if (
            team_norm == canonical
            or team_norm in group["team_variants"]
            or team_norm in group["aliases"]
        ):
            return canonical
    return team_norm


def _query_intent_from_match_type(match_type: str) -> str:
    if match_type.startswith(("exact_player", "exact_thai", "exact_alias", "player_", "alias_", "thai_", "hybrid_")):
        return "player"
    if match_type.startswith("team_") or match_type == "exact_team":
        return "club"
    if match_type.startswith("league_") or match_type == "exact_league":
        return "league"
    if match_type.startswith("nation_"):
        return "nation"
    return "unknown"


def _thai_loose_normalize(text: str) -> str:
    """
    สร้างรูปแบบค้นหาแบบผ่อนปรนสำหรับชื่อทับศัพท์ภาษาไทย

    รองรับรูปแบบที่ผู้ใช้มักพิมพ์แบบเสียงอ่าน เช่น:
      เนย์มาร์ -> เนมา

    หลักการ:
    - normalize/lowercase ตามปกติ
    - ตัดพยัญชนะที่มีทัณฑฆาต (์) พร้อมเครื่องหมาย เพราะมักไม่ออกเสียง
    - ตัดวรรณยุกต์/ไม้ไต่คู้เพื่อให้การค้นหาไม่แพ้เพราะเครื่องหมายกำกับเสียง

    ใช้เป็น secondary matching เท่านั้น ไม่แก้ข้อมูลจริงในฐานข้อมูล
    """
    value = _normalize(text)
    if not value:
        return ""

    result: list[str] = []
    removable_marks = {"็", "่", "้", "๊", "๋"}

    for ch in value:
        if ch == "์":
            if result:
                result.pop()
            continue
        if ch in removable_marks:
            continue
        result.append(ch)

    return "".join(result)


def _levenshtein_percentage(query: str, target: str) -> float:
    """
    Levenshtein % Match ตามสูตร:
      (1 - distance / max(len(query), len(target))) * 100
    """
    q = _normalize(query)
    t = _normalize(target)
    if not q and not t:
        return 100.0
    if not q or not t:
        return 0.0

    distance = Levenshtein.distance(q, t)
    denominator = max(len(q), len(t))
    return max(0.0, (1.0 - (distance / denominator)) * 100.0)


def _jaccard_percentage(query: str, target: str) -> float:
    """
    Jaccard % Match ตามสูตร:
      |A ∩ B| / |A ∪ B| * 100

    ใช้ _tokenize() จึงรองรับ PyThaiNLP/newmm สำหรับภาษาไทยด้วย
    """
    a = set(_tokenize(query))
    b = set(_tokenize(target))
    if not a and not b:
        return 100.0
    if not a or not b:
        return 0.0

    union = a | b
    if not union:
        return 0.0
    return (len(a & b) / len(union)) * 100.0


def _tokenize(text: str) -> list[str]:
    """
    ตัดข้อความเป็น token สำหรับ BM25 แบบ hybrid
    - ภาษาอังกฤษ/ตัวเลขใช้ whitespace tokenization ตามเดิม
    - chunk ที่มีอักษรไทยจะเก็บ token ต้นฉบับไว้ และเพิ่มผลตัดคำจาก PyThaiNLP (newmm)
    วิธีนี้ช่วยค้นหาภาษาไทยแบบติดกัน โดยไม่ทำลายชื่อทับศัพท์ที่ตัวตัดคำอาจแบ่งละเอียดเกินไป
    """
    normalized = _normalize(text)
    if not normalized:
        return []

    tokens: list[str] = []
    for chunk in normalized.split():
        tokens.append(chunk)

        has_thai = any("\u0E00" <= char <= "\u0E7F" for char in chunk)
        if not has_thai:
            continue

        segmented = word_tokenize(chunk, engine="newmm", keep_whitespace=False)
        tokens.extend(
            token
            for token in segmented
            if token.strip() and token != chunk
        )

    return tokens


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
    name_th_loose_norm: str = ""         # loose Thai pronunciation form
    aliases_norm: list[str] = field(default_factory=list)  # normalized aliases
    aliases_loose_norm: list[str] = field(default_factory=list)  # loose Thai alias forms
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

    name_en_norm = _normalize(name_en)
    name_th_norm = _normalize(name_th)
    name_th_loose_norm = _thai_loose_normalize(name_th)
    aliases_norm = [_normalize(a) for a in aliases if a]
    aliases_loose_norm = [
        loose
        for alias in aliases
        if alias
        for loose in [_thai_loose_normalize(alias)]
        if loose and loose != _normalize(alias)
    ]
    team_norm = _normalize(team)
    league_norm = _normalize(league)
    nation_norm = _normalize(nation)

    fuzzy_targets: dict[str, list[str]] = {
        "name_en":        [name_en_norm] if name_en_norm else [],
        "name_th":        list(dict.fromkeys(
            [x for x in [name_th_norm, name_th_loose_norm] if x]
        )),
        "aliases":        list(dict.fromkeys(
            [a for a in aliases_norm if a] + aliases_loose_norm
        )),
        "current_team":   [team_norm] if team_norm and team_norm != "n/a" else [],
        "current_league": [league_norm] if league_norm and league_norm != "n/a" else [],
        "nation":         [nation_norm] if nation_norm and nation_norm != "n/a" else [],
    }

    return _IndexEntry(
        raw=player,
        tokens=_tokenize(bm25_doc),
        fuzzy_targets=fuzzy_targets,
        name_en_norm=name_en_norm,
        name_th_norm=name_th_norm,
        name_th_loose_norm=name_th_loose_norm,
        aliases_norm=aliases_norm,
        aliases_loose_norm=aliases_loose_norm,
        team_norm=team_norm,
        league_norm=league_norm,
        nation_norm=nation_norm,
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
        if corpus and any(corpus):
            self._bm25 = BM25Okapi(corpus, k1=1.5, b=0.75)
        else:
            self._bm25 = None
        self._ready = True

    # ------------------------------------------------------------------
    # Scoring Helpers
    # ------------------------------------------------------------------

    def _club_candidate_identities(self, query_norm: str) -> set[str]:
        """Distinct club identities whose current-team text contains the query."""
        if not query_norm:
            return set()
        return {
            _canonical_team_identity(entry.team_norm)
            for entry in self._entries
            if entry.team_norm
            and entry.team_norm != "n/a"
            and query_norm in entry.team_norm
        }

    def _has_direct_player_match(self, query_norm: str, thai_loose: str) -> bool:
        """Whether query directly targets a player name/alias rather than club text."""
        for entry in self._entries:
            if (
                query_norm == entry.name_en_norm
                or query_norm == entry.name_th_norm
                or query_norm in entry.aliases_norm
            ):
                return True
            if len(query_norm) >= 2 and (
                query_norm in entry.name_en_norm
                or query_norm in entry.name_th_norm
                or any(query_norm in alias for alias in entry.aliases_norm)
            ):
                return True
            if len(thai_loose) >= 3 and (
                thai_loose == entry.name_th_loose_norm
                or thai_loose in entry.aliases_loose_norm
            ):
                return True
        return False

    def _bm25_scores(self, query: str) -> list[float]:
        """คำนวณ BM25 raw scores สำหรับ query"""
        if self._bm25 is None or not self._entries:
            return [0.0] * len(self._entries)
        tokens = _tokenize(query)
        if not tokens:
            return [0.0] * len(self._entries)
        return list(self._bm25.get_scores(tokens))

    def _hybrid_lexical_score_one(
        self,
        query_norm: str,
        entry: _IndexEntry,
    ) -> tuple[float, dict[str, float | str]]:
        """
        รวม 3 lexical signals ต่อ field:
          1) RapidFuzz WRatio
          2) Levenshtein percentage
          3) Jaccard token similarity

        กฎสำคัญ:
        - threshold ใช้กับ raw similarity ก่อน field weight
          เพื่อไม่ให้ typo ของ league/team ถูกตัดทิ้งเพราะ field weight ต่ำกว่า 1
        - Jaccard ใช้เฉพาะ query ที่มีอย่างน้อย 2 token
        - เลือก field ที่ให้ weighted relevance สูงสุด

        Returns:
            (best_score_0_to_1, debug_breakdown)
        """
        query_tokens = set(_tokenize(query_norm))
        use_jaccard = len(query_tokens) >= 2

        best_score = 0.0
        best_debug: dict[str, float | str] = {
            "field": "",
            "wratio": 0.0,
            "levenshtein": 0.0,
            "jaccard": 0.0,
            "lexical": 0.0,
        }

        for field_name, targets in entry.fuzzy_targets.items():
            field_weight = _FUZZY_FIELD_WEIGHTS.get(field_name, 0.5)

            for target in targets:
                if not target or target == "n/a":
                    continue

                wratio = fuzz.WRatio(query_norm, target, processor=None) / 100.0
                levenshtein = _levenshtein_percentage(query_norm, target) / 100.0
                jaccard = (
                    _jaccard_percentage(query_norm, target) / 100.0
                    if use_jaccard
                    else 0.0
                )

                # Candidate gate: typo similarity >= 70% หรือ token overlap >= 34%
                if (
                    max(wratio, levenshtein) < (MIN_FUZZY_SCORE / 100.0)
                    and jaccard < MIN_JACCARD_SCORE
                ):
                    continue

                active_weight = WRATIO_SIGNAL_WEIGHT + LEVENSHTEIN_SIGNAL_WEIGHT
                signal_sum = (
                    WRATIO_SIGNAL_WEIGHT * wratio
                    + LEVENSHTEIN_SIGNAL_WEIGHT * levenshtein
                )

                if use_jaccard:
                    active_weight += JACCARD_SIGNAL_WEIGHT
                    signal_sum += JACCARD_SIGNAL_WEIGHT * jaccard

                lexical_similarity = signal_sum / active_weight
                weighted_score = lexical_similarity * field_weight

                if weighted_score > best_score:
                    best_score = weighted_score
                    best_debug = {
                        "field": field_name,
                        "wratio": round(wratio, 4),
                        "levenshtein": round(levenshtein, 4),
                        "jaccard": round(jaccard, 4),
                        "lexical": round(weighted_score, 4),
                    }

        return best_score, best_debug

    @staticmethod
    def _display_match_percentage(
        relevance_score: float,
        match_type: str = "",
        club_ambiguity_count: int = 0,
        query_norm: str = "",
        matched_team_norm: str = "",
    ) -> float:
        """
        Descriptive relevance for UI; this is not a probability/accuracy value.

        Exact field identity and deterministic known-alias resolution display
        as 100%. Club partials are reduced by query coverage and the number of
        distinct club identities matching the same partial query. This method
        is deliberately simple until real human labels are available.
        """
        score = max(0.0, min(float(relevance_score), 1.0))
        exact_types = {
            "exact_player_name", "exact_thai_name", "exact_alias",
            "exact_team", "team_alias", "team_variant",
            "exact_league", "nation_exact",
        }
        if match_type in exact_types:
            return 100.0

        if match_type == "team_substring" and query_norm and matched_team_norm:
            coverage = min(1.0, len(query_norm) / max(1, len(matched_team_norm)))
            ambiguity = max(1, int(club_ambiguity_count or 0))
            descriptive = score * 100.0 * math.sqrt(coverage / ambiguity)
            return round(max(0.0, min(descriptive, 100.0)), 1)

        return round(score * 100.0, 1)

    # ------------------------------------------------------------------
    # Public Search Interface
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        limit: int = 10,
        threshold: float = DEFAULT_RESULT_THRESHOLD,
        league: str | None = None,
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
        q_thai_loose = _thai_loose_normalize(q_norm)
        has_thai_query = any("\u0E00" <= char <= "\u0E7F" for char in q_norm)
        resolved_club_alias = _resolve_club_alias(q_norm)
        query_team_identity = _canonical_team_identity(q_norm)
        club_candidate_identities = self._club_candidate_identities(q_norm)
        if resolved_club_alias:
            club_candidate_identities = {resolved_club_alias}
        club_ambiguity_count = len(club_candidate_identities)
        has_direct_player_match = self._has_direct_player_match(q_norm, q_thai_loose)
        detected_query_intent = (
            "player"
            if has_direct_player_match
            else "club"
            if club_candidate_identities
            else "unknown"
        )

        league_norm = _normalize(league or "")
        candidate_indices = [
            i
            for i, entry in enumerate(self._entries)
            if not league_norm or entry.league_norm == league_norm
        ]
        if detected_query_intent == "club":
            candidate_indices = [
                i
                for i in candidate_indices
                if _canonical_team_identity(self._entries[i].team_norm)
                in club_candidate_identities
            ]
        if not candidate_indices:
            return []

        # Base short-query protection on normalized Unicode text.
        normalized_query_length = len(q_norm)
        is_short = normalized_query_length <= SHORT_QUERY_LIMIT

        # คำนวณ BM25
        bm25_raw = self._bm25_scores(q_clean)
        bm25_max = max((bm25_raw[i] for i in candidate_indices), default=0.0)

        results: list[dict[str, Any]] = []

        for i in candidate_indices:
            entry = self._entries[i]
            score = 0.0
            match_type = ""

            # -----------------------------------------------------------
            # 1. Exact & Substring Match First:
            # -----------------------------------------------------------
            # 1.1 Exact player / Thai / player-alias matches.
            if q_norm == entry.name_en_norm:
                score = 1.0
                match_type = "exact_player_name"
            elif q_norm == entry.name_th_norm:
                score = 1.0
                match_type = "exact_thai_name"
            elif any(q_norm == a for a in entry.aliases_norm):
                score = 1.0
                match_type = "exact_alias"
            # 1.2 Player-name substring.
            elif (
                len(q_norm) >= 2
                and (q_norm in entry.name_th_norm or q_norm in entry.name_en_norm)
            ):
                score = 0.90
                match_type = "player_substring"
            # 1.3 Player-alias substring.
            elif any(len(q_norm) >= 2 and q_norm in a for a in entry.aliases_norm):
                score = 0.70
                match_type = "alias_substring"
            # 1.4 Thai pronunciation-friendly form.
            elif (
                has_thai_query
                and len(q_thai_loose) >= 3
                and (
                    q_thai_loose == entry.name_th_loose_norm
                    or q_thai_loose in entry.aliases_loose_norm
                )
            ):
                score = 0.92
                match_type = "thai_loose_exact"
            elif (
                has_thai_query
                and len(q_thai_loose) >= 3
                and (
                    q_thai_loose in entry.name_th_loose_norm
                    or any(q_thai_loose in alias for alias in entry.aliases_loose_norm)
                )
            ):
                score = 0.82
                match_type = "thai_loose_substring"
            # 1.5 Known club aliases are resolved before generic partial/fuzzy matching.
            elif (
                resolved_club_alias
                and _team_matches_resolved_alias(entry.team_norm, resolved_club_alias)
            ):
                score = 0.85
                match_type = "team_alias"
            elif q_norm == entry.team_norm:
                score = 0.85
                match_type = "exact_team"
            elif (
                query_team_identity
                and query_team_identity != q_norm
                and query_team_identity == _canonical_team_identity(entry.team_norm)
            ):
                score = 0.80
                match_type = "team_variant"
            elif (
                query_team_identity in CLUB_ALIAS_GROUPS
                and q_norm == query_team_identity
                and query_team_identity == _canonical_team_identity(entry.team_norm)
            ):
                score = 0.80
                match_type = "team_variant"
            elif q_norm == entry.league_norm:
                score = 0.85
                match_type = "exact_league"
            elif q_norm == entry.nation_norm:
                score = 0.85
                match_type = "nation_exact"
            # 1.6 Structured-field partial matching remains distinct from known aliases.
            elif len(q_norm) >= 3 and q_norm in entry.team_norm:
                score = 0.80
                match_type = "team_substring"
            elif len(q_norm) >= 4 and q_norm in entry.league_norm:
                score = 0.75
                match_type = "league_substring"
            elif len(q_norm) >= 3 and q_norm in entry.nation_norm:
                score = 0.75
                match_type = "nation_substring"
            elif is_short:
                # -------------------------------------------------------
                # 3. Short Query Protection (len <= 3):
                # -------------------------------------------------------
                # ห้ามใช้ Fuzzy Search ป้องกันการจับคู่มั่ว
                score = 0.0
            else:
                # -------------------------------------------------------
                # 2. Hybrid typo/context matching:
                #    RapidFuzz WRatio + Levenshtein + Jaccard
                #    แล้วค่อยผสม BM25 เมื่อ query มี token ที่พบในเอกสาร
                # -------------------------------------------------------
                lexical_score, lexical_debug = self._hybrid_lexical_score_one(q_norm, entry)

                # Short Thai queries can look deceptively similar to unrelated Thai aliases
                # (e.g. "ซาลา" vs "ซาก้า"/"ดีบาล่า"/"ซาลิบา"). Exact/substring/
                # Thai-loose alias paths were already checked above, so suppress only the
                # remaining generic fuzzy-alias fallback for this narrow case.
                if (
                    has_thai_query
                    and len(q_thai_loose) <= 4
                    and lexical_debug.get("field") == "aliases"
                ):
                    lexical_score = 0.0

                if lexical_score > 0.0:
                    match_type = {
                        "current_team": "team_fuzzy",
                        "current_league": "league_fuzzy",
                        "nation": "nation_fuzzy",
                    }.get(str(lexical_debug.get("field", "")), "hybrid_bm25_fuzzy")
                    b_norm = (
                        (bm25_raw[i] / bm25_max)
                        if bm25_max > 0.0 and bm25_raw[i] > 0.0
                        else 0.0
                    )
                    if b_norm > 0.0:
                        score = round(
                            BM25_WEIGHT * b_norm + FUZZY_WEIGHT * lexical_score,
                            4,
                        )
                    else:
                        score = round(lexical_score, 4)
                else:
                    score = 0.0

            # -----------------------------------------------------------
            # 4. Filter: ตัดรายการที่ score = 0 ออก
            # -----------------------------------------------------------
            if score > 0.0 and score >= threshold:
                score = float(score)
                result = dict(entry.raw)
                effective_match_type = match_type or "hybrid_bm25_fuzzy"
                result["relevance_score"] = score
                result["match_percentage"] = self._display_match_percentage(
                    score,
                    effective_match_type,
                    club_ambiguity_count=club_ambiguity_count,
                    query_norm=q_norm,
                    matched_team_norm=entry.team_norm,
                )
                result["_match_type"] = effective_match_type
                result["_query_intent"] = (
                    detected_query_intent
                    if detected_query_intent != "unknown"
                    else _query_intent_from_match_type(effective_match_type)
                )
                result["_club_ambiguity_count"] = (
                    club_ambiguity_count
                    if result["_query_intent"] == "club"
                    else 0
                )
                if resolved_club_alias:
                    result["_resolved_club_alias"] = resolved_club_alias
                results.append(result)

        # เรียงลำดับตาม relevance_score จากมากไปน้อย
        results.sort(key=lambda r: r["relevance_score"], reverse=True)
        return results[:limit]
