"""
scraper.py — Football Player Data Scraper
ดึงข้อมูลนักเตะ 100 คนจากแหล่งข้อมูลออนไลน์ พร้อม anti-block measures

Pipeline:
    Phase 1 → TheSportsDB API (หลัก, free, ไม่ต้อง API key)
    Phase 2 → ESPN Soccer API (fallback ถ้า Phase 1 ยังไม่ครบ 100)
    Phase 3 → Mock Data Generator (Auto-fallback เติมจนครบ 100 คนทันที)

Anti-block:
    - random.uniform(1, 3) delay ระหว่าง requests
    - User-Agent rotation (5 pool)
    - Retry with exponential backoff
    - Session reuse
"""

import json
import logging
import random
import time
from pathlib import Path
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Logging — ตั้งค่าระบบบันทึก Log
# ---------------------------------------------------------------------------
# ทำหน้าที่: แสดงข้อความสถานะการดึงข้อมูลแต่ละขั้นตอนใน Console
# ทำไปทำไม: ช่วยให้รู้ว่าตอนนี้โปรแกรม scrape ถึงนักเตะคนไหนแล้ว หรือมี Error เกิดขึ้นที่จุดไหน
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants & Paths — ค่าคงที่และเส้นทางไฟล์
# ---------------------------------------------------------------------------
# ทำหน้าที่: กำหนดค่าที่ใช้ร่วมกันทั้ง script เช่น path บันทึกผล, จำนวนเป้าหมาย, User-Agent list
# ทำไปทำไม: รวมค่าสำคัญไว้ที่เดียว แก้ไขง่าย ไม่ต้องไปแก้ในทุกฟังก์ชัน

OUTPUT_FILE = Path(__file__).parent.parent / "data" / "players.json"
TARGET_COUNT = 100

# รายการ User-Agent เพื่อสลับ Header ทุก Request (ป้องกันถูกบล็อก)
USER_AGENTS: list[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
]

# พจนานุกรมชื่อไทย ฉายา และข้อมูลเสริมของนักเตะระดับโลก
KNOWN_METADATA: dict[str, dict[str, Any]] = {
    "Lionel Messi": {
        "name_th": "ลิโอเนล เมสซี่",
        "aliases": ["เมสซี่", "La Pulga", "LM10", "The GOAT", "Messi", "ต่างดาว"],
        "current_league": "Major League Soccer",
        "current_team": "Inter Miami CF",
        "teams_history": ["FC Barcelona", "Paris Saint-Germain", "Inter Miami CF"],
        "national_team": {"played": True, "team_name": "Argentina", "caps": 189, "goals": 109},
        "stats": {"total_goals": 850, "total_assists": 380, "trophies_count": 44},
    },
    "Cristiano Ronaldo": {
        "name_th": "คริสเตียโน โรนัลโด",
        "aliases": ["CR7", "โรนัลโด", "พี่โด้", "Siuuu", "The Portuguese", "Ronaldo"],
        "current_league": "Saudi Pro League",
        "current_team": "Al Nassr",
        "teams_history": ["Sporting CP", "Manchester United", "Real Madrid", "Juventus", "Manchester United", "Al Nassr"],
        "national_team": {"played": True, "team_name": "Portugal", "caps": 212, "goals": 135},
        "stats": {"total_goals": 905, "total_assists": 240, "trophies_count": 34},
    },
    "Kylian Mbappe": {
        "name_th": "กิลิอัน เอ็มบัปเป",
        "aliases": ["เอ็มบัปเป", "KM7", "ประธานเป้", "Donatello", "Mbappe"],
        "current_league": "La Liga",
        "current_team": "Real Madrid",
        "teams_history": ["AS Monaco", "Paris Saint-Germain", "Real Madrid"],
        "national_team": {"played": True, "team_name": "France", "caps": 86, "goals": 48},
        "stats": {"total_goals": 330, "total_assists": 195, "trophies_count": 18},
    },
    "Erling Haaland": {
        "name_th": "เอร์ลิง ฮาลันด์",
        "aliases": ["ฮาลันด์", "จอมมารบลู", "Cyborg", "EH9", "Haaland"],
        "current_league": "Premier League",
        "current_team": "Manchester City",
        "teams_history": ["Bryne", "Molde", "Red Bull Salzburg", "Borussia Dortmund", "Manchester City"],
        "national_team": {"played": True, "team_name": "Norway", "caps": 39, "goals": 38},
        "stats": {"total_goals": 290, "total_assists": 65, "trophies_count": 12},
    },
    "Neymar": {
        "name_th": "เนย์มาร์",
        "aliases": ["เนย์มาร์", "Ney", "NJR", "O Ney", "Neymar Jr"],
        "current_league": "Saudi Pro League",
        "current_team": "Al Hilal",
        "teams_history": ["Santos", "FC Barcelona", "Paris Saint-Germain", "Al Hilal"],
        "national_team": {"played": True, "team_name": "Brazil", "caps": 128, "goals": 79},
        "stats": {"total_goals": 440, "total_assists": 310, "trophies_count": 22},
    },
    "Mohamed Salah": {
        "name_th": "โมฮาเหม็ด ซาลาห์",
        "aliases": ["ซาลาห์", "บังโม", "The Egyptian King", "Mo Salah"],
        "current_league": "Premier League",
        "current_team": "Liverpool",
        "teams_history": ["El Mokawloon", "Basel", "Chelsea", "Fiorentina", "Roma", "Liverpool"],
        "national_team": {"played": True, "team_name": "Egypt", "caps": 103, "goals": 58},
        "stats": {"total_goals": 360, "total_assists": 155, "trophies_count": 15},
    },
    "Kevin De Bruyne": {
        "name_th": "เควิน เดอ บรอยน์",
        "aliases": ["เดอ บรอยน์", "KDB", "จอมทัพเบลเยียม", "King Kevin"],
        "current_league": "Premier League",
        "current_team": "Manchester City",
        "teams_history": ["Genk", "Chelsea", "Werder Bremen", "VfL Wolfsburg", "Manchester City"],
        "national_team": {"played": True, "team_name": "Belgium", "caps": 107, "goals": 30},
        "stats": {"total_goals": 150, "total_assists": 370, "trophies_count": 20},
    },
    "Jude Bellingham": {
        "name_th": "จูด เบลลิงแฮม",
        "aliases": ["เบลลิงแฮม", "JB5", "JB22", "Bellingham", "น้องจูด"],
        "current_league": "La Liga",
        "current_team": "Real Madrid",
        "teams_history": ["Birmingham City", "Borussia Dortmund", "Real Madrid"],
        "national_team": {"played": True, "team_name": "England", "caps": 40, "goals": 13},
        "stats": {"total_goals": 95, "total_assists": 55, "trophies_count": 6},
    },
    "Vinicius Junior": {
        "name_th": "วินิซิอุส จูเนียร์",
        "aliases": ["วินิ", "Vini Jr", "VJ7", "วินิซิอุส"],
        "current_league": "La Liga",
        "current_team": "Real Madrid",
        "teams_history": ["Flamengo", "Real Madrid"],
        "national_team": {"played": True, "team_name": "Brazil", "caps": 38, "goals": 12},
        "stats": {"total_goals": 130, "total_assists": 115, "trophies_count": 12},
    },
    "Son Heung-min": {
        "name_th": "ซน ฮึง-มิน",
        "aliases": ["ซน", "Sonny", "ตี๋ซน", "SHM7", "โอปป้าซน"],
        "current_league": "Premier League",
        "current_team": "Tottenham Hotspur",
        "teams_history": ["Hamburger SV", "Bayer Leverkusen", "Tottenham Hotspur"],
        "national_team": {"played": True, "team_name": "South Korea", "caps": 129, "goals": 50},
        "stats": {"total_goals": 210, "total_assists": 120, "trophies_count": 4},
    },
    "Harry Kane": {
        "name_th": "แฮร์รี่ เคน",
        "aliases": ["เคน", "Kane", "พายุเคน", "HurriKane"],
        "current_league": "Bundesliga",
        "current_team": "Bayern Munich",
        "teams_history": ["Tottenham Hotspur", "Leicester City", "Norwich City", "Millwall", "Bayern Munich"],
        "national_team": {"played": True, "team_name": "England", "caps": 100, "goals": 68},
        "stats": {"total_goals": 410, "total_assists": 110, "trophies_count": 5},
    },
    "Robert Lewandowski": {
        "name_th": "โรเบิร์ต เลวานดอฟสกี้",
        "aliases": ["เลวาน", "Lewy", "เลวานดอฟสกี้", "Lewangoalski"],
        "current_league": "La Liga",
        "current_team": "FC Barcelona",
        "teams_history": ["Lech Poznan", "Borussia Dortmund", "Bayern Munich", "FC Barcelona"],
        "national_team": {"played": True, "team_name": "Poland", "caps": 154, "goals": 84},
        "stats": {"total_goals": 650, "total_assists": 185, "trophies_count": 28},
    },
    "Lamine Yamal": {
        "name_th": "ลามีน ยามาล",
        "aliases": ["ยามาล", "Yamal", "ดาวรุ่งบาร์ซ่า", "LY19"],
        "current_league": "La Liga",
        "current_team": "FC Barcelona",
        "teams_history": ["FC Barcelona"],
        "national_team": {"played": True, "team_name": "Spain", "caps": 17, "goals": 4},
        "stats": {"total_goals": 20, "total_assists": 25, "trophies_count": 4},
    },
    "Pedri": {
        "name_th": "เปดรี",
        "aliases": ["เปดรี", "Pedri", "เปดรี้", "Pedri Gonzalez"],
        "current_league": "La Liga",
        "current_team": "FC Barcelona",
        "teams_history": ["Las Palmas", "FC Barcelona"],
        "national_team": {"played": True, "team_name": "Spain", "caps": 30, "goals": 4},
        "stats": {"total_goals": 30, "total_assists": 45, "trophies_count": 7},
    },
    "Phil Foden": {
        "name_th": "ฟิล โฟเดน",
        "aliases": ["โฟเดน", "Foden", "Stockport Iniesta"],
        "current_league": "Premier League",
        "current_team": "Manchester City",
        "teams_history": ["Manchester City"],
        "national_team": {"played": True, "team_name": "England", "caps": 41, "goals": 4},
        "stats": {"total_goals": 95, "total_assists": 65, "trophies_count": 17},
    },
    "Bukayo Saka": {
        "name_th": "บูกาโย ซากา",
        "aliases": ["ซากา", "Saka", "Starboy", "ซาก้า"],
        "current_league": "Premier League",
        "current_team": "Arsenal",
        "teams_history": ["Arsenal"],
        "national_team": {"played": True, "team_name": "England", "caps": 42, "goals": 12},
        "stats": {"total_goals": 75, "total_assists": 65, "trophies_count": 5},
    },
    "Rodri": {
        "name_th": "โรดรี",
        "aliases": ["โรดรี", "Rodri", "บัลลงดอร์ 2024", "Rodrigo"],
        "current_league": "Premier League",
        "current_team": "Manchester City",
        "teams_history": ["Villarreal", "Atletico Madrid", "Manchester City"],
        "national_team": {"played": True, "team_name": "Spain", "caps": 56, "goals": 4},
        "stats": {"total_goals": 40, "total_assists": 45, "trophies_count": 18},
    },
    "Virgil van Dijk": {
        "name_th": "เฟอร์จิล ฟาน ไดจ์ค",
        "aliases": ["ฟาน ไดจ์ค", "VVD", "ฟานไดจ์", "ยักษ์ดัตช์"],
        "current_league": "Premier League",
        "current_team": "Liverpool",
        "teams_history": ["Groningen", "Celtic", "Southampton", "Liverpool"],
        "national_team": {"played": True, "team_name": "Netherlands", "caps": 75, "goals": 9},
        "stats": {"total_goals": 55, "total_assists": 25, "trophies_count": 12},
    },
    "Trent Alexander-Arnold": {
        "name_th": "เทรนต์ อเล็กซานเดอร์-อาร์โนลด์",
        "aliases": ["เทรนต์", "TAA", "เทรนต์ 66", "Trent"],
        "current_league": "Premier League",
        "current_team": "Liverpool",
        "teams_history": ["Liverpool"],
        "national_team": {"played": True, "team_name": "England", "caps": 31, "goals": 4},
        "stats": {"total_goals": 25, "total_assists": 90, "trophies_count": 9},
    },
    "Alisson": {
        "name_th": "อลิสซอน เบ็คเกอร์",
        "aliases": ["อลิสซอน", "Alisson", "พ่อหมี", "Alisson Becker"],
        "current_league": "Premier League",
        "current_team": "Liverpool",
        "teams_history": ["Internacional", "Roma", "Liverpool"],
        "national_team": {"played": True, "team_name": "Brazil", "caps": 70, "goals": 1},
        "stats": {"total_goals": 1, "total_assists": 5, "trophies_count": 10},
    },
    "Manuel Neuer": {
        "name_th": "มานูเอล นอยเออร์",
        "aliases": ["นอยเออร์", "Neuer", "สวีปเปอร์คีปเปอร์", "กำแพงเบอร์ลิน"],
        "current_league": "Bundesliga",
        "current_team": "Bayern Munich",
        "teams_history": ["Schalke 04", "Bayern Munich"],
        "national_team": {"played": True, "team_name": "Germany", "caps": 124, "goals": 0},
        "stats": {"total_goals": 0, "total_assists": 12, "trophies_count": 32},
    },
    "Cole Palmer": {
        "name_th": "โคล พาล์เมอร์",
        "aliases": ["พาล์เมอร์", "Cold Palmer", "Palmer", "ไอ้หนาว"],
        "current_league": "Premier League",
        "current_team": "Chelsea",
        "teams_history": ["Manchester City", "Chelsea"],
        "national_team": {"played": True, "team_name": "England", "caps": 9, "goals": 2},
        "stats": {"total_goals": 40, "total_assists": 25, "trophies_count": 6},
    },
}

# รายชื่อ 120 นักเตะที่จะ query จาก TheSportsDB
PLAYER_SEARCH_LIST: list[str] = [
    "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappe", "Erling Haaland",
    "Neymar", "Mohamed Salah", "Kevin De Bruyne", "Jude Bellingham",
    "Vinicius Junior", "Son Heung-min", "Harry Kane", "Robert Lewandowski",
    "Lamine Yamal", "Pedri", "Phil Foden", "Bukayo Saka",
    "Rodri", "Virgil van Dijk", "Trent Alexander-Arnold", "Alisson Becker",
    "Manuel Neuer", "Joshua Kimmich", "Jamal Musiala", "Florian Wirtz",
    "Declan Rice", "Marcus Rashford", "Raheem Sterling", "Jack Grealish",
    "Bruno Fernandes", "Casemiro", "Ruben Dias", "Bernardo Silva",
    "Karim Benzema", "Antoine Griezmann", "Ousmane Dembele", "Olivier Giroud",
    "Romelu Lukaku", "Lautaro Martinez", "Paulo Dybala", "Julian Alvarez",
    "Alexis Mac Allister", "Enzo Fernandez", "Richarlison", "Gabriel Martinelli",
    "Leandro Trossard", "Kai Havertz", "Thomas Muller", "Serge Gnabry",
    "Leroy Sane", "Toni Kroos", "Federico Valverde", "Eduardo Camavinga",
    "Aurelien Tchouameni", "Eder Militao", "Ferland Mendy", "Dani Carvajal",
    "Gavi", "Ferran Torres", "Ansu Fati", "Ilkay Gundogan",
    "Thiago Silva", "Marquinhos", "Danilo", "Raphinha",
    "Cody Gakpo", "Darwin Nunez", "Diogo Jota", "Luis Diaz",
    "Andy Robertson", "Martin Odegaard", "Gabriel Jesus", "Gabriel Magalhaes",
    "William Saliba", "Granit Xhaka", "Nicolo Barella", "Federico Chiesa",
    "Gianluigi Donnarumma", "Theo Hernandez", "Mike Maignan", "Rafael Leao",
    "Hakan Calhanoglu", "Khvicha Kvaratskhelia", "Victor Osimhen", "Kim Min-jae",
    "Christian Pulisic", "Tijjani Reijnders", "Pedro Neto", "Cole Palmer",
    "Moises Caicedo", "Reece James", "Marc Cucurella", "Alexis Sanchez",
    "Edinson Cavani", "Luis Suarez", "Sadio Mane", "Riyad Mahrez",
    "N'Golo Kante", "Paul Pogba", "Angel Di Maria", "David de Gea",
    "Thibaut Courtois", "Jan Oblak", "Emiliano Martinez", "Marc-Andre ter Stegen",
    "Alphonso Davies", "Achraf Hakimi", "Theo Hernandez", "Lucas Hernandez",
    "Alejandro Garnacho", "Kobbie Mainoo", "Rasmus Hojlund", "Amad Diallo",
    "Arda Guler", "Endrick", "Alexander Isak", "Anthony Gordon",
    "Bruno Guimaraes", "Lucas Paqueta", "Eberechi Eze", "Michael Olise",
]


# ---------------------------------------------------------------------------
# Country → ISO 3166-1 alpha-2 Code Mapping  (สำหรับ FlagCDN)
# ---------------------------------------------------------------------------
# ทำหน้าที่: แปลงชื่อประเทศ (ภาษาอังกฤษ) ให้เป็น รหัส ISO 2 ตัวอักษร
# ทำไปทำไม: ใช้สร้าง URL รูปธงชาติจาก FlagCDN เช่น "argentina" → "ar" → https://flagcdn.com/w80/ar.png

COUNTRY_TO_CODE: dict[str, str] = {
    # ทวีปอเมริกาใต้
    "argentina": "ar",
    "brazil": "br",
    "colombia": "co",
    "uruguay": "uy",
    "ecuador": "ec",
    "chile": "cl",
    "peru": "pe",
    "venezuela": "ve",
    "paraguay": "py",
    "bolivia": "bo",
    # ยุโรป
    "portugal": "pt",
    "spain": "es",
    "france": "fr",
    "germany": "de",
    "italy": "it",
    "netherlands": "nl",
    "belgium": "be",
    "england": "gb-eng",
    "scotland": "gb-sct",
    "wales": "gb-wls",
    "northern ireland": "gb-nir",
    "united kingdom": "gb",
    "norway": "no",
    "sweden": "se",
    "denmark": "dk",
    "switzerland": "ch",
    "austria": "at",
    "poland": "pl",
    "croatia": "hr",
    "serbia": "rs",
    "ukraine": "ua",
    "czech republic": "cz",
    "slovakia": "sk",
    "hungary": "hu",
    "romania": "ro",
    "bulgaria": "bg",
    "greece": "gr",
    "turkey": "tr",
    "russia": "ru",
    "georgia": "ge",
    "albania": "al",
    "slovenia": "si",
    "ireland": "ie",
    # แอฟริกา
    "nigeria": "ng",
    "ghana": "gh",
    "senegal": "sn",
    "egypt": "eg",
    "cameroon": "cm",
    "ivory coast": "ci",
    "côte d'ivoire": "ci",
    "morocco": "ma",
    "algeria": "dz",
    "mali": "ml",
    "guinea": "gn",
    "gabon": "ga",
    "south africa": "za",
    "kenya": "ke",
    "tanzania": "tz",
    # เอเชีย
    "south korea": "kr",
    "korea republic": "kr",
    "japan": "jp",
    "china": "cn",
    "australia": "au",
    "iran": "ir",
    "saudi arabia": "sa",
    "qatar": "qa",
    "united arab emirates": "ae",
    "iraq": "iq",
    "jordan": "jo",
    "uzbekistan": "uz",
    # อเมริกาเหนือ / กลาง / แคริบเบียน
    "usa": "us",
    "united states": "us",
    "mexico": "mx",
    "canada": "ca",
    "costa rica": "cr",
    "panama": "pa",
    "jamaica": "jm",
    "trinidad and tobago": "tt",
    # โอเชียเนีย
    "new zealand": "nz",
}

# Default images เมื่อไม่พบข้อมูล
DEFAULT_FLAG_URL = "https://flagcdn.com/w80/un.png"            # UN flag (สำหรับประเทศที่ map ไม่ได้)
DEFAULT_LOGO_URL = "https://placehold.co/80x80?text=Club"      # Placeholder โลโก้สโมสร

# Cache โลโก้สโมสร (team_name → badge_url) เพื่อลด API calls
# ทำหน้าที่: เก็บ URL โลโก้สโมสรระดับโลกที่รู้จักไว้ล่วงหน้า (pre-seeded)
# ทำไปทำไม: ลดจำนวน HTTP request ที่ต้องยิงไป TheSportsDB และเพิ่มความเร็วในการ scrape
_logo_cache: dict[str, str] = {
    "inter miami": "https://r2.thesportsdb.com/images/media/team/badge/m4it3e1602103647.png",
    "inter miami cf": "https://r2.thesportsdb.com/images/media/team/badge/m4it3e1602103647.png",
    "al nassr": "https://r2.thesportsdb.com/images/media/team/badge/84yvqi1748524565.png",
    "al-nassr": "https://r2.thesportsdb.com/images/media/team/badge/84yvqi1748524565.png",
    "real madrid": "https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png",
    "fc barcelona": "https://r2.thesportsdb.com/images/media/team/badge/k4zo0k1641767927.png",
    "barcelona": "https://r2.thesportsdb.com/images/media/team/badge/k4zo0k1641767927.png",
    "manchester city": "https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png",
    "arsenal": "https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png",
    "liverpool": "https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png",
    "bayern munich": "https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png",
    "bayern munchen": "https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png",
    "paris saint-germain": "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
    "paris saint germain": "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
    "psg": "https://r2.thesportsdb.com/images/media/team/badge/26f50y1705434178.png",
    "chelsea": "https://r2.thesportsdb.com/images/media/team/badge/yvwvtu1448813215.png",
    "manchester united": "https://r2.thesportsdb.com/images/media/team/badge/xzqdr11517660794.png",
    "tottenham hotspur": "https://r2.thesportsdb.com/images/media/team/badge/df209b1580479216.png",
    "tottenham": "https://r2.thesportsdb.com/images/media/team/badge/df209b1580479216.png",
    "juventus": "https://r2.thesportsdb.com/images/media/team/badge/f1352h1595758253.png",
    "ac milan": "https://r2.thesportsdb.com/images/media/team/badge/wsqwtv1420577586.png",
    "milan": "https://r2.thesportsdb.com/images/media/team/badge/wsqwtv1420577586.png",
    "inter milan": "https://r2.thesportsdb.com/images/media/team/badge/7t9v4o1621848524.png",
    "inter": "https://r2.thesportsdb.com/images/media/team/badge/7t9v4o1621848524.png",
    "internazionale": "https://r2.thesportsdb.com/images/media/team/badge/7t9v4o1621848524.png",
    "atletico madrid": "https://r2.thesportsdb.com/images/media/team/badge/7z2a0f1568277259.png",
    "bayer leverkusen": "https://r2.thesportsdb.com/images/media/team/badge/quwuyt1421434407.png",
    "borussia dortmund": "https://r2.thesportsdb.com/images/media/team/badge/tuxvxy1420577663.png",
    "dortmund": "https://r2.thesportsdb.com/images/media/team/badge/tuxvxy1420577663.png",
    "al hilal": "https://r2.thesportsdb.com/images/media/team/badge/1n898y1660683073.png",
    "al ittihad": "https://r2.thesportsdb.com/images/media/team/badge/77864h1599573887.png",
    "al ahli": "https://r2.thesportsdb.com/images/media/team/badge/aegovm1599573812.png",
    "newcastle united": "https://r2.thesportsdb.com/images/media/team/badge/s7754w1596728097.png",
    "aston villa": "https://r2.thesportsdb.com/images/media/team/badge/4v709g1689254420.png",
    "galatasaray": "https://r2.thesportsdb.com/images/media/team/badge/121rws1608670557.png",
    "fenerbahce": "https://r2.thesportsdb.com/images/media/team/badge/s9k5b41608670494.png",
    "roma": "https://r2.thesportsdb.com/images/media/team/badge/twupvy1421436154.png",
    "as roma": "https://r2.thesportsdb.com/images/media/team/badge/twupvy1421436154.png",
    "napoli": "https://r2.thesportsdb.com/images/media/team/badge/4u6w5s1628100109.png",
}


def _get_flag_url(country_name: str) -> str:
    """
    แปลงชื่อประเทศ → FlagCDN URL
    เช่น  "Argentina" → "https://flagcdn.com/w80/ar.png"
    """
    if not country_name or country_name == "N/A":
        return DEFAULT_FLAG_URL
    code = COUNTRY_TO_CODE.get(country_name.lower().strip())
    if code:
        return f"https://flagcdn.com/w80/{code}.png"
    return DEFAULT_FLAG_URL


def _get_club_logo_url(session: "requests.Session", team_name: str) -> str:
    """
    ดึง URL โลโก้สโมสรจาก TheSportsDB searchteams API
    - Cache ผลลัพธ์ใน _logo_cache เพื่อไม่ต้อง call ซ้ำ
    - คืน DEFAULT_LOGO_URL ถ้าหาไม่พบ
    """
    if not team_name or team_name == "N/A":
        return DEFAULT_LOGO_URL

    # ดึงจาก cache ก่อน
    cache_key = team_name.lower().strip()
    if cache_key in _logo_cache:
        return _logo_cache[cache_key]

    try:
        url = "https://www.thesportsdb.com/api/v1/json/3/searchteams.php"
        resp = session.get(url, params={"t": team_name}, headers=_random_headers(), timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            teams = data.get("teams") or []
            if teams:
                badge = teams[0].get("strBadge") or teams[0].get("strLogo") or DEFAULT_LOGO_URL
                _logo_cache[cache_key] = badge
                return badge
    except Exception as exc:
        logger.debug("โลโก้สโมสร '%s' ดึงไม่ได้: %s", team_name, exc)

    _logo_cache[cache_key] = DEFAULT_LOGO_URL
    return DEFAULT_LOGO_URL


# ---------------------------------------------------------------------------
# HTTP Session with Retry — ตั้งค่า HTTP Session ป้องกันเน็ตหลุด
# ---------------------------------------------------------------------------
# ทำหน้าที่: สร้าง Session ที่ retry อัตโนมัติสูงสุด 3 ครั้งเมื่อเจอ error 429/5xx
# ทำไปทำไม: ลดความเสี่ยงที่การ scrape จะล้มเหลวจากเน็ตหลุดชั่วคราวหรือ API rate limit

def _build_session() -> requests.Session:
    """สร้าง requests Session พร้อม retry strategy ป้องกันเน็ตหลุด"""
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def _random_headers() -> dict[str, str]:
    """สลับ User-Agent ทุกรอบ request"""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "application/json, text/html, */*",
        "Accept-Language": "th,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }


def _polite_delay(min_sec: float = 1.0, max_sec: float = 3.0) -> None:
    """หน่วงเวลาสุ่ม random.uniform(1, 3) เพื่อป้องกันการโดนบล็อก IP"""
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)


def _safe_int(value: Any, default: int = 0) -> int:
    """แปลง value เป็น int อย่างปลอดภัย"""
    if value is None:
        return default
    try:
        val_str = str(value).strip()
        if "-" in val_str:  # e.g. "1987-06-24"
            val_str = val_str.split("-")[0]
        v = int(val_str)
        if 1950 <= v <= 2015:  # แปลงปีเกิดเป็นอายุ (ค.ศ. 2025)
            return 2025 - v
        return v if v >= 0 else default
    except (ValueError, TypeError):
        return default


# ---------------------------------------------------------------------------
# Data Normalization — แปลงข้อมูล raw API ให้อยู่ในรูปแบบมาตรฐาน
# ---------------------------------------------------------------------------
# ทำหน้าที่: รวม logic การแปลง raw data จาก TheSportsDB/ESPN ให้มี field ครบตามโมเดล
# ทำไปทำไม: ข้อมูลจาก API แต่ละแหล่งมีโครงสร้างต่างกัน ฟังก์ชันนี้ทำให้ได้ผลลัพธ์ที่สม่ำเสมอ

def _normalize_player(raw: dict[str, Any], player_id: int, session: requests.Session | None = None) -> dict[str, Any]:
    """
    Data Normalization:
    - ดึง fields: id, name_en, name_th, aliases, age, photo_url, club_logo_url, flag_url,
      current_league, current_team, teams_history, national_team, stats
    - หากฟิลด์ไหนไม่มีข้อมูล ให้ใส่ค่า Default เช่น 0 หรือ "N/A"
    - ผสานข้อมูลจาก KNOWN_METADATA สำหรับชื่อไทย ฉายา รูปธงชาติ และโลโก้สโมสร
    """
    name_en = raw.get("strPlayer") or raw.get("name_en") or "Unknown Player"
    name_en = name_en.strip()

    # เช็คว่ามี metadata สำเร็จรูปไหม
    meta = KNOWN_METADATA.get(name_en, {})

    # ชื่อไทย
    name_th = meta.get("name_th") or raw.get("name_th") or raw.get("strPlayerAlternate") or name_en

    # ฉายา
    aliases = meta.get("aliases") or raw.get("aliases") or []
    if not aliases and name_th != name_en:
        aliases = [name_th]

    # อายุ
    birth = raw.get("dateBorn") or raw.get("intBirthYear") or raw.get("age")
    age = _safe_int(birth, default=meta.get("age", 25))

    # รูปถ่าย
    photo_url = raw.get("strThumb") or raw.get("strCutout") or raw.get("photo_url") or "N/A"

    # สโมสรและลีก
    team = meta.get("current_team") or raw.get("strTeam") or raw.get("current_team") or "N/A"
    league = meta.get("current_league") or raw.get("strLeague") or raw.get("current_league") or "N/A"

    # ประวัติทีม
    teams_history = meta.get("teams_history") or raw.get("teams_history") or ([team] if team != "N/A" else [])

    # ทีมชาติ
    nation_meta = meta.get("national_team", {})
    nation_name = nation_meta.get("team_name") or raw.get("strNationality") or raw.get("strNationalTeam") or "N/A"
    national_team = {
        "played": nation_meta.get("played", True if nation_name != "N/A" else False),
        "team_name": nation_name,
        "caps": nation_meta.get("caps") or _safe_int(raw.get("national_team", {}).get("caps"), default=0),
        "goals": nation_meta.get("goals") or _safe_int(raw.get("national_team", {}).get("goals"), default=0),
    }

    # รูปธงชาติ (FlagCDN หรือ Official)
    flag_url = meta.get("flag_url") or raw.get("flag_url") or raw.get("strFlag")
    if not flag_url or flag_url == "N/A":
        flag_url = _get_flag_url(nation_name)

    # โลโก้สโมสร (TheSportsDB API lookup พร้อมแคช / Fallback)
    club_logo = meta.get("club_logo_url") or raw.get("club_logo_url") or raw.get("strBadge") or raw.get("strTeamBadge")
    if not club_logo and session:
        # ลอง lookup จาก idTeam ก่อนถ้ามี
        team_id = raw.get("idTeam")
        if team_id:
            cache_k = f"id_{team_id}"
            if cache_k in _logo_cache:
                club_logo = _logo_cache[cache_k]
            else:
                try:
                    t_resp = session.get(
                        f"https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id={team_id}",
                        headers=_random_headers(),
                        timeout=5,
                    )
                    if t_resp.status_code == 200:
                        t_data = t_resp.json()
                        t_teams = t_data.get("teams") or []
                        if t_teams:
                            badge = t_teams[0].get("strBadge") or t_teams[0].get("strLogo")
                            if badge:
                                club_logo = badge
                                _logo_cache[cache_k] = badge
                                if team and team != "N/A":
                                    _logo_cache[team.lower().strip()] = badge
                except Exception:
                    pass

        # ถ้ายังไม่ได้รูป ให้ค้นหาจากชื่อทีม
        if not club_logo and team and team != "N/A":
            club_logo = _get_club_logo_url(session, team)

    if not club_logo or club_logo == "N/A":
        club_logo = DEFAULT_LOGO_URL

    # สถิติ
    stats_meta = meta.get("stats", {})
    stats = {
        "total_goals": stats_meta.get("total_goals") or _safe_int(raw.get("stats", {}).get("total_goals"), default=0),
        "total_assists": stats_meta.get("total_assists") or _safe_int(raw.get("stats", {}).get("total_assists"), default=0),
        "trophies_count": stats_meta.get("trophies_count") or _safe_int(raw.get("stats", {}).get("trophies_count"), default=0),
    }

    return {
        "id": player_id,
        "name_en": name_en,
        "name_th": name_th,
        "aliases": aliases,
        "age": age,
        "photo_url": photo_url,
        "club_logo_url": club_logo,
        "flag_url": flag_url,
        "current_league": league,
        "current_team": team,
        "teams_history": teams_history,
        "national_team": national_team,
        "stats": stats,
    }


# ---------------------------------------------------------------------------
# Phase 1: TheSportsDB API — แหล่งข้อมูลหลัก
# ---------------------------------------------------------------------------
# ทำหน้าที่: วนค้นหานักเตะทีละคนจาก PLAYER_SEARCH_LIST ผ่าน TheSportsDB free API
# ทำไปทำไม: เป็น API ฟรีที่ให้ข้อมูลนักเตะละเอียดที่สุด รวมถึงรูปภาพ สโมสร และสถิติ

SPORTSDB_SEARCH_URL = "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php"


def scrape_thesportsdb(session: requests.Session, target: int = TARGET_COUNT) -> list[dict[str, Any]]:
    """ดึงข้อมูลนักเตะจาก TheSportsDB API พร้อม Anti-block random delay"""
    players: list[dict] = []
    seen_names: set[str] = set()

    logger.info("═══ Phase 1: TheSportsDB API ═══")

    for idx, name in enumerate(PLAYER_SEARCH_LIST, start=1):
        if len(players) >= target:
            break

        try:
            logger.info("[%d/%d] กำลังดึง: %s", idx, len(PLAYER_SEARCH_LIST), name)
            resp = session.get(
                SPORTSDB_SEARCH_URL,
                params={"p": name},
                headers=_random_headers(),
                timeout=8,
            )
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("player") or []
                for raw in results[:1]:
                    p_name = raw.get("strPlayer", "").strip()
                    if p_name and p_name.lower() not in seen_names:
                        seen_names.add(p_name.lower())
                        player = _normalize_player(raw, player_id=len(players) + 1, session=session)
                        players.append(player)
                        logger.info("  ✓ %s | %s | %s", player["name_en"], player["name_th"], player["current_team"])
            
            # สุ่มหน่วงเวลา 1-3 วินาทีตามข้อกำหนด
            _polite_delay(1.0, 3.0)

        except Exception as exc:
            logger.warning("  ⚠ ข้าม %s เนื่องจาก error: %s", name, exc)
            _polite_delay(1.0, 2.0)
            continue

    logger.info("Phase 1 สำเร็จ: ได้ %d คน", len(players))
    return players


# ---------------------------------------------------------------------------
# Phase 2: ESPN Soccer API (Fallback) — แหล่งข้อมูลสำรอง
# ---------------------------------------------------------------------------
# ทำหน้าที่: ดึงข้อมูลนักเตะจาก ESPN API เมื่อ Phase 1 ได้ข้อมูลไม่ครบ 100 คน
# ทำไปทำไม: ช่วยเพิ่มความครอบคลุม ถ้า TheSportsDB ไม่มีข้อมูลนักเตะบางคน

ESPN_API_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/athletes"


def scrape_espn(session: requests.Session, existing_count: int, target: int = TARGET_COUNT) -> list[dict[str, Any]]:
    """ดึงข้อมูลนักเตะจาก ESPN Soccer API เป็น fallback"""
    needed = target - existing_count
    if needed <= 0:
        return []

    logger.info("═══ Phase 2: ESPN Soccer API (ต้องการเพิ่ม %d คน) ═══", needed)
    players: list[dict] = []

    try:
        for page in range(1, 4):
            if len(players) >= needed:
                break
            resp = session.get(
                ESPN_API_URL,
                params={"limit": 50, "page": page},
                headers=_random_headers(),
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                athletes = data.get("athletes", [])
                for athlete in athletes:
                    if len(players) >= needed:
                        break
                    raw = {
                        "strPlayer": athlete.get("displayName", "Unknown"),
                        "strTeam": athlete.get("team", {}).get("displayName", "N/A") if athlete.get("team") else "N/A",
                        "strLeague": "N/A",
                        "photo_url": athlete.get("headshot", {}).get("href", "N/A") if athlete.get("headshot") else "N/A",
                        "age": athlete.get("age", 25),
                        "strNationality": athlete.get("citizenship", "N/A"),
                    }
                    player = _normalize_player(raw, player_id=existing_count + len(players) + 1, session=session)
                    players.append(player)
                    logger.info("  ESPN ✓ %s | ทีม: %s", player["name_en"], player["current_team"])

            _polite_delay(1.0, 2.0)
    except Exception as exc:
        logger.warning("ESPN API error: %s", exc)

    logger.info("Phase 2 สำเร็จ: ได้เพิ่ม %d คน", len(players))
    return players


# ---------------------------------------------------------------------------
# Phase 3: Mock Data Generator (Auto-Fallback เติมจนครบ 100 คนทันที)
# ---------------------------------------------------------------------------
# ทำหน้าที่: สร้างข้อมูลนักเตะจำลองจาก pool ที่เตรียมไว้ เมื่อ Phase 1 + 2 ยังได้ไม่ครบ 100 คน
# ทำไปทำไม: รับประกันว่าระบบจะมีข้อมูลนักเตะครบ 100 คนเสมอ แม้ API ภายนอกจะล่มหรือถูกบล็อก

_MOCK_PLAYERS_POOL = [
    ("Jamal Musiala", "จามาล มูเซียลา", ["มูเซียลา", "Musiala", "แบมบี้"], "Bayern Munich", "Bundesliga", "Germany", 21, 60, 50, 10),
    ("Florian Wirtz", "ฟลอเรียน เวียร์ทซ์", ["เวียร์ทซ์", "Wirtz"], "Bayer Leverkusen", "Bundesliga", "Germany", 21, 55, 55, 5),
    ("Declan Rice", "เดแคลน ไรซ์", ["ไรซ์", "Rice"], "Arsenal", "Premier League", "England", 25, 30, 35, 4),
    ("Marcus Rashford", "มาร์คัส แรชฟอร์ด", ["แรชฟอร์ด", "ด็อกเตอร์แรช"], "Manchester United", "Premier League", "England", 26, 135, 80, 10),
    ("Jack Grealish", "แจ็ค กรีลิช", ["กรีลิช", "Super Jack"], "Manchester City", "Premier League", "England", 28, 55, 70, 12),
    ("Bruno Fernandes", "บรูโน แฟร์นันเดส", ["บรูโน", "กัปตันบรูโน"], "Manchester United", "Premier League", "Portugal", 29, 110, 95, 8),
    ("Ruben Dias", "รูเบน ดิอาส", ["ดิอาส", "Dias"], "Manchester City", "Premier League", "Portugal", 27, 12, 15, 14),
    ("Bernardo Silva", "แบร์นาร์โด ซิลวา", ["แบร์นาร์โด", "พ่อมดโปรตุกีส"], "Manchester City", "Premier League", "Portugal", 29, 90, 110, 20),
    ("Antoine Griezmann", "อ็องตวน กรีซมันน์", ["กรีซมันน์", "Griezmann"], "Atletico Madrid", "La Liga", "France", 33, 260, 130, 15),
    ("Lautaro Martinez", "เลาตาโร มาร์ติเนซ", ["เลาตาโร", "เอล โทโร่"], "Inter Milan", "Serie A", "Argentina", 26, 180, 60, 12),
    ("Julian Alvarez", "ฆูเลียน อัลบาเรซ", ["อัลบาเรซ", "ไอ้แมงมุม"], "Atletico Madrid", "La Liga", "Argentina", 24, 105, 60, 10),
    ("Enzo Fernandez", "เอนโซ เฟร์นานเดซ", ["เอนโซ", "Enzo"], "Chelsea", "Premier League", "Argentina", 23, 30, 45, 6),
    ("Alexis Mac Allister", "อเล็กซิส แม็ค อัลลิสเตอร์", ["แม็คก้า", "Mac Allister"], "Liverpool", "Premier League", "Argentina", 25, 65, 45, 8),
    ("Gabriel Martinelli", "กาเบรียล มาร์ติเนลลี", ["มาร์ติเนลลี", "Gabi"], "Arsenal", "Premier League", "Brazil", 23, 80, 55, 6),
    ("Kai Havertz", "ไค ฮาแวร์ตซ์", ["ฮาแวร์ตซ์", "King Kai"], "Arsenal", "Premier League", "Germany", 25, 105, 60, 8),
    ("Federico Valverde", "เฟเดริโก บัลเบร์เด", ["บัลเบร์เด", "เอล ปาฮาริโต้"], "Real Madrid", "La Liga", "Uruguay", 25, 55, 60, 14),
    ("Eduardo Camavinga", "เอดูอาร์โด กามาวินก้า", ["กามาวินก้า", "Camavinga"], "Real Madrid", "La Liga", "France", 21, 20, 30, 10),
    ("Gavi", "กาบี", ["กาบี", "Gavi"], "FC Barcelona", "La Liga", "Spain", 20, 25, 40, 6),
    ("Raphinha", "ราฟินญา", ["ราฟินญา", "Raphinha"], "FC Barcelona", "La Liga", "Brazil", 27, 135, 90, 8),
    ("Martin Odegaard", "มาร์ติน โอเดการ์ด", ["โอเดการ์ด", "กัปตันโอเด"], "Arsenal", "Premier League", "Norway", 25, 75, 80, 7),
    ("William Saliba", "วิลเลียม ซาลิบา", ["ซาลิบา", "Saliba"], "Arsenal", "Premier League", "France", 23, 10, 10, 5),
    ("Gianluigi Donnarumma", "จานลุยจิ ดอนนารุมมา", ["ดอนนารุมมา", "จิจิโอ้"], "Paris Saint-Germain", "Ligue 1", "Italy", 25, 0, 0, 8),
    ("Theo Hernandez", "เตโอ แอร์น็องเดซ", ["เตโอ", "Theo"], "AC Milan", "Serie A", "France", 26, 60, 70, 8),
    ("Rafael Leao", "ราฟาเอล เลเอา", ["เลเอา", "Leao"], "AC Milan", "Serie A", "Portugal", 25, 95, 80, 8),
    ("Khvicha Kvaratskhelia", "ควิตชา ควารัตสเคเลีย", ["ควาราดอนน่า", "Kvara"], "Paris Saint-Germain", "Ligue 1", "Georgia", 23, 75, 80, 6),
    ("Victor Osimhen", "วิกเตอร์ โอซิมเฮน", ["โอซิมเฮน", "Osimhen"], "Galatasaray", "Super Lig", "Nigeria", 25, 125, 40, 8),
    ("Christian Pulisic", "คริสเตียน พูลิซิช", ["พูลิซิช", "กัปตันอเมริกา"], "AC Milan", "Serie A", "USA", 25, 85, 70, 8),
    ("Moises Caicedo", "มอยเซส ไกเซโด", ["ไกเซโด", "Caicedo"], "Chelsea", "Premier League", "Ecuador", 22, 12, 20, 4),
    ("Alejandro Garnacho", "อเลฮานโดร การ์นาโช", ["การ์นาโช", "กานาโช่"], "Manchester United", "Premier League", "Argentina", 20, 40, 30, 4),
    ("Kobbie Mainoo", "ค็อบบี้ ไมนู", ["ไมนู", "Mainoo"], "Manchester United", "Premier League", "England", 19, 15, 15, 3),
    ("Arda Guler", "อาร์ดา กูแลร์", ["กูแลร์", "เมสซี่ตุรกี"], "Real Madrid", "La Liga", "Turkey", 19, 20, 25, 5),
    ("Alexander Isak", "อเล็กซานเดอร์ อิซัค", ["อิซัค", "Isak"], "Newcastle United", "Premier League", "Sweden", 24, 110, 40, 5),
    ("Sadio Mane", "ซาดิโอ มาเน่", ["มาเน่", "Mane"], "Al Nassr", "Saudi Pro League", "Senegal", 32, 260, 140, 16),
    ("Riyad Mahrez", "ริยาด มาห์เรซ", ["มาห์เรซ", "Mahrez"], "Al Ahli", "Saudi Pro League", "Algeria", 33, 200, 170, 17),
    ("N'Golo Kante", "เอ็นโกโล่ ก็องเต้", ["ก็องเต้", "Kante"], "Al Ittihad", "Saudi Pro League", "France", 33, 35, 40, 15),
    ("Karim Benzema", "คาริม เบนเซม่า", ["เบนเซม่า", "Benzema", "KB9", "เบนซ์"], "Al Ittihad", "Saudi Pro League", "France", 36, 470, 210, 33),
]


def generate_mock_players(start_id: int, count: int) -> list[dict[str, Any]]:
    """ฟังก์ชันสร้าง Mock Data นักเตะจำลองเติมจนครบ 100 คนทันที (Auto-Fallback)"""
    logger.info("═══ Phase 3: Auto-Fallback Mock Data (เติม %d คน) ═══", count)
    players: list[dict] = []
    pool = (_MOCK_PLAYERS_POOL * ((count // len(_MOCK_PLAYERS_POOL)) + 2))[:count]

    for i, item in enumerate(pool):
        name_en, name_th, aliases, team, league, nation, age, goals, assists, trophies = item
        player_id = start_id + i
        photo_filename = name_en.lower().replace(" ", "_").replace("'", "")
        flag_url = _get_flag_url(nation)
        club_logo = _logo_cache.get(team.lower().strip()) or DEFAULT_LOGO_URL

        player = {
            "id": player_id,
            "name_en": name_en,
            "name_th": name_th,
            "aliases": aliases,
            "age": age,
            "photo_url": f"https://www.thesportsdb.com/images/media/player/thumb/{photo_filename}.jpg",
            "club_logo_url": club_logo,
            "flag_url": flag_url,
            "current_league": league,
            "current_team": team,
            "teams_history": [team],
            "national_team": {
                "played": True,
                "team_name": nation,
                "caps": random.randint(15, 110),
                "goals": random.randint(2, 45),
            },
            "stats": {
                "total_goals": goals,
                "total_assists": assists,
                "trophies_count": trophies,
            },
        }
        players.append(player)
        logger.info("  Mock ✓ [%d] %s (%s)", player_id, name_en, name_th)

    return players


# ---------------------------------------------------------------------------
# Main Orchestrator — ฟังก์ชันหลักที่ควบคุมกระบวนการ Scraping ทั้งหมด
# ---------------------------------------------------------------------------
# ทำหน้าที่: เรียกใช้ Phase 1 → 2 → 3 ตามลำดับ เก็บผลรวม และบันทึกเป็น players.json
# ทำไปทำไม: รวมทุก Phase ไว้ในฟังก์ชันเดียว ง่ายต่อการเรียกใช้และทดสอบ

def run_scraper() -> None:
    """รันกระบวนการดึงข้อมูล 100 คน และบันทึก players.json"""
    logger.info("=" * 60)
    logger.info("🚀 เริ่มต้น Football Player Scraper (เป้าหมาย %d คน)", TARGET_COUNT)
    logger.info("=" * 60)

    session = _build_session()
    all_players: list[dict] = []

    # 1. Scrape TheSportsDB
    phase1 = scrape_thesportsdb(session, target=TARGET_COUNT)
    all_players.extend(phase1)
    logger.info("สถานะหลัง Phase 1: %d/%d คน", len(all_players), TARGET_COUNT)

    # 2. Scrape ESPN (ถ้ายังไม่ครบ)
    if len(all_players) < TARGET_COUNT:
        phase2 = scrape_espn(session, existing_count=len(all_players), target=TARGET_COUNT)
        all_players.extend(phase2)
        logger.info("สถานะหลัง Phase 2: %d/%d คน", len(all_players), TARGET_COUNT)

    # 3. Auto-fallback Mock (เติมจนครบ 100 คนทันที)
    if len(all_players) < TARGET_COUNT:
        needed = TARGET_COUNT - len(all_players)
        phase3 = generate_mock_players(start_id=len(all_players) + 1, count=needed)
        all_players.extend(phase3)
        logger.info("สถานะหลัง Phase 3: %d/%d คน", len(all_players), TARGET_COUNT)

    # ตัดให้ได้ 100 คนพอดี และรัน ID 1..100
    all_players = all_players[:TARGET_COUNT]
    for i, p in enumerate(all_players, start=1):
        p["id"] = i

    # บันทึกไฟล์ players.json
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(all_players, f, ensure_ascii=False, indent=2)

    logger.info("=" * 60)
    logger.info("✅ บันทึกข้อมูลนักเตะ %d คนลงใน %s เรียบร้อยแล้ว!", len(all_players), OUTPUT_FILE)
    logger.info("=" * 60)


if __name__ == "__main__":
    run_scraper()
