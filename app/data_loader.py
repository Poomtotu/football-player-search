"""
data_loader.py — โหลดและ validate ข้อมูลนักเตะจาก mock_players.json
ใช้ Pydantic เพื่อ type-safe parsing อัตโนมัติ
"""

import json
import logging
from pathlib import Path

from app.models import Player

logger = logging.getLogger(__name__)

# Path ของ JSON file โดย resolve จาก root ของโปรเจกต์
_DATA_FILE = Path(__file__).parent.parent / "data" / "mock_players.json"


def load_players() -> list[Player]:
    """
    โหลดข้อมูลนักเตะจาก mock_players.json และ validate ด้วย Pydantic

    Returns:
        list[Player]: รายการ Player objects ที่ผ่าน validation แล้ว

    Raises:
        FileNotFoundError: ถ้าไม่พบไฟล์ JSON
        ValueError: ถ้าโครงสร้าง JSON ไม่ถูกต้อง
    """
    if not _DATA_FILE.exists():
        raise FileNotFoundError(
            f"ไม่พบไฟล์ข้อมูลนักเตะ: {_DATA_FILE}\n"
            "โปรดตรวจสอบว่ามีไฟล์ data/mock_players.json อยู่ในโปรเจกต์"
        )

    logger.info("กำลังโหลดข้อมูลนักเตะจาก %s", _DATA_FILE)

    with _DATA_FILE.open(encoding="utf-8") as f:
        raw_data: list[dict] = json.load(f)

    # Pydantic validate ทุก record — จะ raise ValidationError ถ้า schema ไม่ตรง
    players = [Player.model_validate(item) for item in raw_data]

    logger.info("โหลดข้อมูลนักเตะสำเร็จ จำนวน %d คน", len(players))
    return players
