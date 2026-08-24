# ⚽ Football Player Information Retrieval (IR) System

ระบบค้นหาและจัดอันดับประวัตินักฟุตบอลระดับโลก (100 คน) ด้วยเทคนิค **Hybrid Information Retrieval (Okapi BM25 + RapidFuzz WRatio)** พร้อม **Web Application UI (React + Vite + Tailwind CSS)** ในธีม **Modern Dark Mode** สไตล์สปอร์ต

---

## 📑 สารบัญ
1. [ภาพรวมของระบบ (Overview)](#-ภาพรวมของระบบ-overview)
2. [โครงสร้างโปรเจกต์ (Project Structure)](#-โครงสร้างโปรเจกต์-project-structure)
3. [หลักการทำงานของระบบ Information Retrieval (IR Deep-Dive)](#-หลักการทำงานของระบบ-information-retrieval-ir-deep-dive)
   - [3.1 Okapi BM25 Algorithm](#31-okapi-bm25-algorithm)
   - [3.2 RapidFuzz String Matching](#32-rapidfuzz-string-matching)
   - [3.3 Normalization & Linear Combination](#33-normalization--linear-combination)
   - [3.4 Field Boosting & Typo Handling](#34-field-boosting--typo-handling)
4. [คู่มือการติดตั้งและรันระบบ (Setup & Running Guide)](#-คู่มือการติดตั้งและรันระบบ-setup--running-guide)
   - [4.1 รัน Backend API (FastAPI)](#41-รัน-backend-api-fastapi)
   - [4.2 รัน Frontend Dev Server (React + Vite)](#42-รัน-frontend-dev-server-react--vite)
   - [4.3 รัน Data Scraper (สร้าง players.json ใหม่)](#43-รัน-data-scraper-สร้าง-playersjson-ใหม่)
5. [API Specification & cURL Examples](#-api-specification--curl-examples)
6. [ฟีเจอร์ Error Handling & Notification](#-ฟีเจอร์-error-handling--notification)

---

## 🌟 ภาพรวมของระบบ (Overview)

ระบบถูกออกแบบมาเพื่อแก้ปัญหาการค้นหาข้อมูลนักฟุตบอลที่มีความหลากหลายทางภาษา (ชื่อไทย, ชื่ออังกฤษ, ฉายาเฉพาะกลุ่ม) และรองรับการสะกดคำผิด (Typos) ได้อย่างชาญฉลาด

- **ฐานข้อมูล:** นักเตะระดับโลก 100 คน (`players.json`) ครบทุกมิติ (รูปถ่าย, ชื่อไทย/อังกฤษ, สโมสร, ลีก, ประวัติค้าแข้ง, สถิติประตู/แอสซิสต์/ถ้วยรางวัล, ข้อมูลทีมชาติ)
- **เครื่องยนต์ค้นหา (IR Engine):** รวมจุดเด่นของ Term Frequency Based Ranking (BM25) และ Approximate String Matching (Levenshtein/WRatio)
- **ส่วนหน้าบ้าน (Frontend):** Modern Dark Mode UI, ช่องค้นหาใหญ่พร้อม Debounce 300ms, สถิติ 3 มิติ, ป๊อปอัปดูรายละเอียดเต็มรูปแบบ (Modal), ระบบแจ้งเตือนเมื่อเซิร์ฟเวอร์ขัดข้อง

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
web IR นักฟุตบอล/
├── app/
│   ├── __init__.py           # Package Init
│   ├── main.py               # FastAPI Endpoints, CORS, Error Handlers & SPA Server
│   └── models.py             # Pydantic v2 Models & OpenAPI Validation
├── frontend/                 # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # แถบนำทาง, สถานะ Server, ลิงก์ Swagger
│   │   │   ├── HeroSearch.jsx        # ช่องค้นหาใหญ่, ชิปคำค้นหา, ฟิลเตอร์ลีก
│   │   │   ├── PlayerCard.jsx        # การ์ดนักเตะ, สถิติ 3 ช่อง, Relevance Match
│   │   │   ├── PlayerModal.jsx       # ป๊อปอัปรายละเอียด, Timeline ค้าแข้ง, ปุ่มแชร์
│   │   │   ├── SkeletonCard.jsx      # Skeleton Loader ระหว่างรอผลลัพธ์
│   │   │   ├── EmptyState.jsx        # หน้าจอเมื่อไม่พบข้อมูลพร้อมคำแนะนำ
│   │   │   ├── StatsSummary.jsx      # แถบสรุปผลและ Latency การค้นหา
│   │   │   └── ErrorNotification.jsx # Toast แจ้งเตือนเมื่อ Backend ขัดข้อง
│   │   ├── hooks/
│   │   │   └── useDebounce.js        # Custom Hook หน่วงเวลาพิมพ์ 300ms
│   │   ├── App.jsx                   # Main State & Logic
│   │   ├── index.css                 # Tailwind CSS & Glassmorphism Theme
│   │   └── main.jsx                  # React DOM Entry
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── scraper.py                # Data Scraper (TheSportsDB API + ESPN + Auto-fallback)
├── search_engine.py          # Standalone Hybrid IR Engine (BM25 + RapidFuzz)
├── players.json              # ฐานข้อมูลนักเตะ 100 คน
├── main.py                   # Root Entry Point
├── requirements.txt          # Python Dependencies
└── README.md
```

---

## 🧠 หลักการทำงานของระบบ Information Retrieval (IR Deep-Dive)

ระบบใช้สถาปัตยกรรม **Hybrid Search Pipeline** ที่รวมสองกระบวนการเข้าด้วยกัน:

```
                      ┌────────────────────────────────────────┐
                      │            Query String (q)            │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌─────────────────────────┐                     ┌─────────────────────────┐
     │      Okapi BM25         │                     │    RapidFuzz WRatio     │
     │  (Lexical & Term Match) │                     │ (Typo & Fuzzy Matching) │
     └────────────┬────────────┘                     └────────────┬────────────┘
                  │                                               │
                  ▼                                               ▼
         Raw BM25 Scores                                 Raw Fuzzy Scores (0-100)
                  │                                               │
                  ▼                                               ▼
       Min-Max Normalization                           Max-Score Normalization
            (0.0 - 1.0)                                     (0.0 - 1.0)
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │       Linear Weighted Sum           │
                       │  Score = 0.55×BM25 + 0.45×Fuzzy    │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │  Sort Descending & Threshold Filter │
                       │    (คืนค่าเป็น relevance_score)     │
                       └─────────────────────────────────────┘
```

---

### 3.1 Okapi BM25 Algorithm

**BM25 (Best Matching 25)** เป็นอัลกอริทึมจัดอันดับเอกสารตามความถี่ของคำ (Term Frequency) และความสำคัญของคำในคลังเอกสาร (Inverse Document Frequency):

$$\text{Score}_{\text{BM25}}(D, Q) = \sum_{i=1}^{n} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

- **$\text{IDF}(q_i)$**: ความเฉพาะเจาะจงของคำ หากคำนั้นปรากฏในนักเตะทุกคน จะได้ค่าน้อย แต่ถ้าปรากฏเฉพาะคน จะได้ค่าสูง
- **$f(q_i, D)$**: ความถี่ที่คำค้นหาปรากฏใน Document ของนักเตะคนนั้น
- **$|D|$ และ $\text{avgdl}$**: ความยาวของ Document ของนักเตะ เทียบกับความยาวเฉลี่ยของทั้งคลัง
- **พารามิเตอร์ที่ปรับแต่ง:**
  - $k_1 = 1.5$: ควบคุมการอิ่มตัวของ Term Frequency (ป้องกันคะแนนพุ่งเกินจริงเมื่อคำซ้ำมากๆ)
  - $b = 0.75$: ควบคุมน้ำหนักการปรับความยาวของเอกสาร (Document Length Normalization)

---

### 3.2 RapidFuzz String Matching

ใช้ **`rapidfuzz.fuzz.WRatio` (Weighted Ratio)** ซึ่งคำนวณระยะห่างของตัวอักษร (Levenshtein Distance) ร่วมกับเทคนิค:
- **Simple Ratio:** เปรียบเทียบความเหมือนโดยตรง
- **Partial Ratio:** ค้นหาคำที่ตรงกันบางส่วน (Substring Match)
- **Token Sort Ratio:** เรียงลำดับคำก่อนเปรียบเทียบ (สลับหน้าหลังไม่มีผล เช่น "Messi Lionel" $\to$ "Lionel Messi")
- **Token Set Ratio:** กรองคำซ้ำและเปรียบเทียบเฉพาะกลุ่มคำที่มีความหมาย

**Field Weights สำหรับ Fuzzy Search:**
- ชื่อภาษาอังกฤษ (`name_en`): น้ำหนัก **1.0**
- ชื่อภาษาไทย (`name_th`): น้ำหนัก **1.0**
- ฉายา (`aliases`): น้ำหนัก **1.0**
- สโมสรปัจจุบัน (`current_team`): น้ำหนัก **0.7**
- ลีกปัจจุบัน (`current_league`): น้ำหนัก **0.5**
- ประเทศทีมชาติ (`national_team`): น้ำหนัก **0.4**

---

### 3.3 Normalization & Linear Combination

เนื่องจากคะแนน Raw BM25 (ช่วงค่าขึ้นกับขนาดคลัง) และคะแนน Fuzzy (0–100) มีมาตราส่วนไม่เท่ากัน ระบบจึงทำการ Normalize ให้อยู่ในช่วง $[0.0, 1.0]$:

$$\text{BM25}_{\text{norm}} = \frac{\text{Score}_{\text{BM25}}}{\max(\text{Scores}_{\text{BM25}})}$$

$$\text{Fuzzy}_{\text{norm}} = \frac{\text{Score}_{\text{Fuzzy}}}{\max(\text{Scores}_{\text{Fuzzy}})}$$

จากนั้นรวมคะแนนเป็น **`relevance_score`**:

$$\text{relevance\_score} = 0.55 \cdot \text{BM25}_{\text{norm}} + 0.45 \cdot \text{Fuzzy}_{\text{norm}}$$

---

### 3.4 Field Boosting & Typo Handling

- **Field Boosting:** ในการสร้าง BM25 Document ระบบจะทำการใส่ชื่ออังกฤษ ชื่อไทย และฉายาซ้ำเป็น 2 เท่า ($\times 2$) เพื่อเพิ่มน้ำหนักความสำคัญของชื่อเหนือข้อมูลสโมสรหรือลีก
- **Typo Tolerance Examples:**
  - `Mesi` $\to$ ค้นพบ **Lionel Messi** อันดับ 1 (Fuzzy WRatio กวาดจับคำสะกดตก 's')
  - `messy` $\to$ ค้นพบ **Lionel Messi** อันดับ 1
  - `roanaldo` $\to$ ค้นพบ **Cristiano Ronaldo** อันดับ 1
  - `halland` $\to$ ค้นพบ **Erling Haaland** อันดับ 1
  - `จอมมารบลู` $\to$ ค้นพบ **Erling Haaland** อันดับ 1 (จาก Aliases)
  - `พี่โด้` $\to$ ค้นพบ **Cristiano Ronaldo** อันดับ 1 (จาก Aliases)
  - `บังโม` $\to$ ค้นพบ **Mohamed Salah** อันดับ 1 (จาก Aliases)

---

## 🚀 คู่มือการติดตั้งและรันระบบ (Setup & Running Guide)

### สิ่งที่จำเป็นก่อนเริ่ม (Prerequisites)
- **Python 3.10+**
- **Node.js 18+** (หรือใช้ Portable Node ในโฟลเดอร์ `tools/node`)

---

### 4.1 รัน Backend API (FastAPI)

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd "web IR นักฟุตบอล"

# 2. สร้างและเปิดใช้งาน Virtual Environment
python -m venv venv
venv\Scripts\activate          # สำหรับ Windows
# source venv/bin/activate     # สำหรับ macOS/Linux

# 3. ติดตั้ง Dependencies
pip install -r requirements.txt

# 4. รันเซิร์ฟเวอร์ FastAPI บนโฮสต์ 0.0.0.0 พอร์ต 8000 (เปิดให้เครื่องอื่นเข้าถึงได้)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# หรือรันผ่าน python main.py
```

- **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Production Web App:** [http://localhost:8000](http://localhost:8000) (เสิร์ฟตรงจาก FastAPI)

---

### 4.2 รัน Frontend Dev Server (React + Vite)

```bash
# 1. เข้าสู่โฟลเดอร์ frontend
cd frontend

# 2. ติดตั้ง Node Packages
npm install

# 3. กำหนดค่า API Base URL ในไฟล์ .env (รองรับ Cross-Origin / เครื่องอื่นในวง LAN)
# VITE_API_BASE_URL=http://localhost:8000 (หรือ http://<IP-เครื่องเซิร์ฟเวอร์>:8000)

# 4. รัน Development Server บนพอร์ต 3000 (รองรับ host 0.0.0.0)
npm run dev -- --host
```

- **Frontend Live App (Local):** [http://localhost:3000](http://localhost:3000)
- **Frontend Live App (Network):** `http://<IP-Address>:3000`

---

### 🌐 การเปิดใช้งานแบบ Cross-Origin (CORS) & เข้าถึงจากเครื่องอื่น

1. **Backend (FastAPI):**
   - มีการติดตั้ง `CORSMiddleware` ใน `app/main.py` โดยอนุญาต `allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]` เพื่อให้เครื่องลูกข่ายหรือ Frontend จากทุก Domain/Port เชื่อมต่อได้
   - สั่งรัน uvicorn ด้วย `--host 0.0.0.0` เพื่อเปิดรับการเชื่อมต่อจากภายนอกเครื่อง

2. **Frontend (React):**
   - มีไฟล์ `frontend/.env` กำหนดตัวแปร `VITE_API_BASE_URL` เช่น:
     ```env
     VITE_API_BASE_URL=http://192.168.1.50:8000
     ```
   - ตัวแปรนี้จะถูกนำไปใช้อัตโนมัติในทุก Endpoint ของระบบ (`/api/players/search`, `/health`, `/api/players`) ผ่านโมดูล [`config.js`](file:///b:/web%20IR%20นักฟุตบอล/frontend/src/config.js)

---

### 4.3 รัน Data Scraper (สร้าง players.json ใหม่)

หากต้องการสแครปข้อมูลใหม่จาก TheSportsDB API + ESPN:
```bash
python scraper.py
```
*ระบบจะสลับ User-Agent และหน่วงเวลาสุ่ม 1–3 วินาทีเพื่อป้องกันการโดนบล็อก IP พร้อมระบบ Auto-Fallback เติม Mock Data ให้ครบ 100 คนทันที*

---

## 📡 API Specification & cURL Examples

### 1. ค้นหานักเตะด้วย Hybrid IR
`GET /api/players/search?q={query}&limit={limit}&threshold={threshold}`

```bash
# ค้นหาด้วยชื่อภาษาไทย
curl "http://localhost:8000/api/players/search?q=เมสซี่"

# ค้นหาด้วยฉายา
curl "http://localhost:8000/api/players/search?q=CR7"
curl "http://localhost:8000/api/players/search?q=จอมมารบลู"

# ค้นหาคำสะกดผิด (Typo)
curl "http://localhost:8000/api/players/search?q=Mesi"
curl "http://localhost:8000/api/players/search?q=roanaldo"

# ค้นหาด้วยชื่อสโมสร
curl "http://localhost:8000/api/players/search?q=Real+Madrid"
```

**ตัวอย่าง Response JSON:**
```json
{
  "query": "เมสซี่",
  "total": 1,
  "results": [
    {
      "id": 1,
      "name_en": "Lionel Messi",
      "name_th": "ลิโอเนล เมสซี่",
      "aliases": ["เมสซี่", "La Pulga", "LM10", "The GOAT", "Messi", "ต่างดาว"],
      "age": 38,
      "photo_url": "https://r2.thesportsdb.com/images/media/player/thumb/kpfsvp1725295651.jpg",
      "current_league": "Major League Soccer",
      "current_team": "Inter Miami CF",
      "teams_history": ["FC Barcelona", "Paris Saint-Germain", "Inter Miami CF"],
      "national_team": {
        "played": true,
        "team_name": "Argentina",
        "caps": 189,
        "goals": 109
      },
      "stats": {
        "total_goals": 850,
        "total_assists": 380,
        "trophies_count": 44
      },
      "relevance_score": 1.0
    }
  ]
}
```

### 2. ดึงนักเตะทั้งหมด
`GET /api/players`

### 3. ดึงนักเตะตาม ID
`GET /api/players/{id}`

### 4. Health Check
`GET /health`

---

## 🛡️ ฟีเจอร์ Error Handling & Notification

1. **Frontend Connection Error Toast (`ErrorNotification.jsx`):**
   - ตรวจจับเมื่อไม่สามารถเชื่อมต่อไปยัง `http://localhost:8000`
   - แสดง Toast ลอยมุมขวาล่างพร้อมปุ่ม **"ลองเชื่อมต่อใหม่ (Retry)"**
   - มีระบบ Auto-polling เช็กสถานะ backend ทุก 20 วินาที เพื่อกู้คืนสถานะกลับมาเป็นปกติอัตโนมัติเมื่อ backend กลับมาทำงาน
2. **In-Page Error Banner:**
   - แสดงข้อความเตือนชัดเจนในหน้าค้นหาเมื่อ API คืนค่า Error
3. **Backend Global Exception Handling:**
   - ครอบคลุม Unhandled Exceptions ทั้งหมด คืนค่าเป็น Structured JSON (`status_code: 500`) พร้อม log stack trace ในระบบ

---

## 👥 ผู้พัฒนาและเทคโนโลยีที่ใช้
- **Backend:** FastAPI, Python 3.11, Pydantic v2, Rank-BM25, RapidFuzz, Uvicorn
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Lucide React Icons
- **Data Source:** TheSportsDB API, ESPN Soccer Stats
