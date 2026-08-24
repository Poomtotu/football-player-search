"""
ir_engine.py — Hybrid Information Retrieval Engine
รวม BM25 (term-frequency ranking) กับ RapidFuzz (fuzzy string matching)
เพื่อค้นหานักเตะได้ทั้งชื่อไทย/อังกฤษ/ฉายา แม้ผู้ใช้พิมพ์ผิด

Pipeline:
    query
      │
      ├─► BM25Okapi  ──────────── normalize ──────────┐
      │   (corpus = ทุก text field ต่อกัน)             │  weighted sum
      │                                               ├─► relevance_score
      └─► RapidFuzz WRatio ──── normalize ────────────┘
          (เทียบกับ name_en, name_th, aliases)

Weights: BM25 = 0.55 | Fuzzy = 0.45
"""

import logging
import unicodedata
from dataclasses import dataclass

from rank_bm25 import BM25Okapi
from rapidfuzz import fuzz

from app.models import Player, PlayerSearchResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants — ปรับ weights และ threshold ได้ที่นี่
# ---------------------------------------------------------------------------

BM25_WEIGHT: float = 0.55   # น้ำหนัก BM25 score (ดีกับการค้นหาคำตรง)
FUZZY_WEIGHT: float = 0.45  # น้ำหนัก Fuzzy score (ดีกับการพิมพ์ผิด)
DEFAULT_THRESHOLD: float = 0.0   # คะแนนขั้นต่ำ default
FUZZY_FIELD_WEIGHTS: dict[str, float] = {
    "name_en": 1.0,   # ให้น้ำหนักชื่ออังกฤษเต็ม
    "name_th": 1.0,   # ให้น้ำหนักชื่อไทยเต็ม
    "aliases": 1.0,   # ให้น้ำหนัก alias เต็ม
    "current_team": 0.7,
    "current_league": 0.5,
}


# ---------------------------------------------------------------------------
# Text Utilities
# ---------------------------------------------------------------------------

def _normalize_text(text: str) -> str:
    """
    Normalize ข้อความก่อน tokenize:
    - lowercase
    - NFKC Unicode normalization (รองรับอักษรไทยและ special chars)
    - ลบ whitespace ส่วนเกิน
    """
    text = unicodedata.normalize("NFKC", text)
    return text.lower().strip()


def _tokenize(text: str) -> list[str]:
    """
    Tokenize ข้อความเป็น list ของ tokens
    - แยกด้วย whitespace (ภาษาไทยและอังกฤษ)
    - กรอง empty strings
    """
    return [tok for tok in _normalize_text(text).split() if tok]


def _build_player_document(player: Player) -> str:
    """
    รวมทุก text field ของนักเตะเป็น document เดียวสำหรับ BM25 indexing
    ใส่ name_en และ name_th ซ้ำเพื่อเพิ่ม term frequency (boosting)
    """
    parts = [
        player.name_en,
        player.name_en,   # boost: ให้ชื่อมี TF สูงกว่า fields อื่น
        player.name_th,
        player.name_th,   # boost
        " ".join(player.aliases),
        " ".join(player.aliases),  # boost
        player.current_team,
        player.current_league,
        player.national_team.team_name,
    ]
    return " ".join(parts)


# ---------------------------------------------------------------------------
# IREngine — Core Class
# ---------------------------------------------------------------------------

@dataclass
class _IndexedPlayer:
    """ข้อมูลที่ preprocess แล้วสำหรับแต่ละนักเตะใน index"""

    player: Player
    document: str         # raw document string
    tokens: list[str]     # tokenized สำหรับ BM25
    # Fields แยกสำหรับ fuzzy matching
    fuzzy_targets: dict[str, list[str]]  # field_name → list of strings


class IREngine:
    """
    Hybrid Information Retrieval Engine สำหรับค้นหานักเตะ

    การทำงาน:
        1. build_index() — สร้าง BM25 index และ preprocess ข้อมูล fuzzy
        2. search() — รัน BM25 + Fuzzy, รวมคะแนน, คืน PlayerSearchResult
    """

    def __init__(self) -> None:
        self._players: list[Player] = []
        self._indexed: list[_IndexedPlayer] = []
        self._bm25: BM25Okapi | None = None
        self._is_ready: bool = False

    # ------------------------------------------------------------------
    # Public Properties
    # ------------------------------------------------------------------

    @property
    def is_ready(self) -> bool:
        """True ถ้า index พร้อมใช้งาน"""
        return self._is_ready

    @property
    def player_count(self) -> int:
        """จำนวนนักเตะใน index"""
        return len(self._players)

    # ------------------------------------------------------------------
    # Index Building
    # ------------------------------------------------------------------

    def build_index(self, players: list[Player]) -> None:
        """
        สร้าง BM25 index จากรายการนักเตะ
        เรียกครั้งเดียวตอน startup (FastAPI lifespan)

        Args:
            players: รายการ Player ที่โหลดจาก mock_players.json
        """
        logger.info("กำลังสร้าง IR index สำหรับนักเตะ %d คน", len(players))

        self._players = players
        self._indexed = []
        corpus_tokens: list[list[str]] = []

        for player in players:
            # สร้าง document text และ tokenize สำหรับ BM25
            doc = _build_player_document(player)
            tokens = _tokenize(doc)
            corpus_tokens.append(tokens)

            # สร้าง fuzzy targets: แต่ละ field เป็น list of strings
            fuzzy_targets: dict[str, list[str]] = {
                "name_en": [player.name_en],
                "name_th": [player.name_th],
                "aliases": player.aliases,
                "current_team": [player.current_team],
                "current_league": [player.current_league],
            }

            self._indexed.append(
                _IndexedPlayer(
                    player=player,
                    document=doc,
                    tokens=tokens,
                    fuzzy_targets=fuzzy_targets,
                )
            )

        # BM25Okapi: k1 ควบคุม term saturation, b ควบคุม length normalization
        self._bm25 = BM25Okapi(corpus_tokens, k1=1.5, b=0.75)
        self._is_ready = True
        logger.info("IR index พร้อมแล้ว ✓")

    # ------------------------------------------------------------------
    # BM25 Scoring
    # ------------------------------------------------------------------

    def _compute_bm25_scores(self, query: str) -> list[float]:
        """
        คำนวณ BM25 scores สำหรับทุกนักเตะ

        Args:
            query: คำค้นหาที่ normalize แล้ว

        Returns:
            list[float]: BM25 raw scores (ยังไม่ normalize), index ตรงกับ self._indexed
        """
        assert self._bm25 is not None, "ต้อง build_index() ก่อน"

        query_tokens = _tokenize(query)
        if not query_tokens:
            return [0.0] * len(self._indexed)

        return list(self._bm25.get_scores(query_tokens))

    # ------------------------------------------------------------------
    # Fuzzy Scoring
    # ------------------------------------------------------------------

    def _compute_fuzzy_score_for_player(
        self, query: str, indexed: _IndexedPlayer
    ) -> float:
        """
        คำนวณ fuzzy score สำหรับนักเตะ 1 คน
        ใช้ rapidfuzz.fuzz.WRatio (Weighted Ratio) ซึ่งลอง partial/token strategies หลายแบบ

        Args:
            query: คำค้นหา (raw, ไม่ต้อง normalize เพราะ rapidfuzz จัดการเอง)
            indexed: _IndexedPlayer ที่ preprocess แล้ว

        Returns:
            float: คะแนน fuzzy สูงสุดในช่วง 0–100
        """
        best_score: float = 0.0

        for field_name, targets in indexed.fuzzy_targets.items():
            field_weight = FUZZY_FIELD_WEIGHTS.get(field_name, 0.5)

            for target in targets:
                # WRatio: เลือก strategy ที่ดีที่สุด (ratio, partial_ratio, token_set_ratio ฯลฯ)
                score = fuzz.WRatio(query, target, processor=_normalize_text)
                weighted = score * field_weight

                if weighted > best_score:
                    best_score = weighted

        return best_score  # 0–100 (ก่อน normalize)

    def _compute_fuzzy_scores(self, query: str) -> list[float]:
        """
        คำนวณ fuzzy scores สำหรับทุกนักเตะ

        Returns:
            list[float]: fuzzy scores (0–100), index ตรงกับ self._indexed
        """
        return [
            self._compute_fuzzy_score_for_player(query, indexed)
            for indexed in self._indexed
        ]

    # ------------------------------------------------------------------
    # Score Normalization & Combining
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_scores(scores: list[float]) -> list[float]:
        """
        Min-Max normalization: แปลง scores ให้อยู่ในช่วง 0.0–1.0
        ถ้า max == 0 (ไม่มี match เลย) คืน list ของ 0.0 ทั้งหมด
        """
        max_score = max(scores) if scores else 0.0
        if max_score == 0.0:
            return [0.0] * len(scores)
        return [s / max_score for s in scores]

    def _combine_scores(
        self,
        bm25_norm: list[float],
        fuzzy_norm: list[float],
    ) -> list[float]:
        """
        รวม BM25 และ Fuzzy scores ด้วย weighted sum
        combined = BM25_WEIGHT * bm25 + FUZZY_WEIGHT * fuzzy

        การตั้งค่า weights:
        - เพิ่ม BM25_WEIGHT: ให้ความสำคัญกับการ match คำตรง
        - เพิ่ม FUZZY_WEIGHT: ให้ความสำคัญกับการ match แบบ approximate
        """
        return [
            BM25_WEIGHT * b + FUZZY_WEIGHT * f
            for b, f in zip(bm25_norm, fuzzy_norm)
        ]

    # ------------------------------------------------------------------
    # Main Search Interface
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        limit: int = 10,
        threshold: float = DEFAULT_THRESHOLD,
    ) -> list[PlayerSearchResult]:
        """
        ค้นหานักเตะด้วย Hybrid IR (BM25 + Fuzzy)

        Args:
            query:     คำค้นหา (ภาษาไทย/อังกฤษ/ฉายา/พิมพ์ผิดได้)
            limit:     จำนวนผลลัพธ์สูงสุดที่ return (default 10)
            threshold: คะแนนขั้นต่ำในการ filter (0.0–1.0)

        Returns:
            list[PlayerSearchResult]: รายการนักเตะเรียงตาม relevance_score (มากไปน้อย)

        Raises:
            RuntimeError: ถ้าเรียก search() ก่อน build_index()
        """
        if not self._is_ready:
            raise RuntimeError("IR Engine ยังไม่ ready — ต้องเรียก build_index() ก่อน")

        if not query or not query.strip():
            logger.warning("รับ query เปล่า — คืน empty results")
            return []

        logger.debug("กำลังค้นหา: %r", query)

        # Step 1: คำนวณ raw scores จากทั้งสอง retriever
        bm25_raw = self._compute_bm25_scores(query)
        fuzzy_raw = self._compute_fuzzy_scores(query)

        # Step 2: Normalize ทั้งคู่เป็น 0–1
        bm25_norm = self._normalize_scores(bm25_raw)
        fuzzy_norm = self._normalize_scores(fuzzy_raw)  # 0–100 → 0–1 via max-norm

        # Step 3: Weighted combination
        combined = self._combine_scores(bm25_norm, fuzzy_norm)

        # Step 4: สร้าง results พร้อม relevance_score, filter threshold, sort
        results: list[PlayerSearchResult] = []
        for idx, (indexed, score) in enumerate(zip(self._indexed, combined)):
            if score < threshold:
                continue

            # round score เป็น 4 decimal places เพื่อความ readable
            results.append(
                PlayerSearchResult(
                    **indexed.player.model_dump(),
                    relevance_score=round(score, 4),
                )
            )

        # เรียงจากคะแนนมากไปน้อย แล้ว slice ตาม limit
        results.sort(key=lambda r: r.relevance_score, reverse=True)
        results = results[:limit]

        logger.debug(
            "ค้นหา %r เสร็จ พบ %d ผลลัพธ์ (threshold=%.2f)",
            query,
            len(results),
            threshold,
        )
        return results
