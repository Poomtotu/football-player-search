import json
from pathlib import Path
from urllib.parse import quote_plus

root = Path(__file__).resolve().parents[1]
for path in [root / "data" / "players.json", root / "data" / "mock_players.json"]:
    if not path.exists():
        continue
    players = json.loads(path.read_text(encoding="utf-8"))
    for p in players:
        name = p.get("name_en", "นักฟุตบอล")
        team = p.get("current_team", "ไม่ระบุสโมสร")
        league = p.get("current_league", "ไม่ระบุลีก")
        nation = (p.get("national_team") or {}).get("team_name", "ไม่ระบุทีมชาติ")
        history = p.get("teams_history") or []
        previous = " → ".join(history) if history else "ยังไม่มีข้อมูลเส้นทางอาชีพ"
        p["bio"] = f"{name} เป็นนักฟุตบอลอาชีพ ปัจจุบันลงเล่นให้ {team} ใน {league} และเป็นตัวแทนทีมชาติ {nation} เส้นทางสโมสร: {previous}."
        q = quote_plus(name)
        p["social_links"] = {
            "instagram": f"https://www.google.com/search?q={q}+Instagram",
            "facebook": f"https://www.google.com/search?q={q}+Facebook",
            "x": f"https://www.google.com/search?q={q}+X+Twitter",
            "youtube": f"https://www.youtube.com/results?search_query={q}",
        }
    path.write_text(json.dumps(players, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("updated", path.name, len(players), "players")
