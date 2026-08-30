// ===========================================================================
// config.js — การตั้งค่า API Base URL สำหรับฝั่ง Frontend (Cross-Origin Support)
// ===========================================================================

// ดึงตัวแปร VITE_API_BASE_URL จากไฟล์ .env (ถ้าไม่มีจะใช้ค่าว่าง "" เพื่อให้รองรับ Relative Path อัตโนมัติ)
// ช่วยให้สามารถเปิดดูผ่าน Localhost, LAN IP (เช่น 192.168.1.173) หรือ Cloudflare HTTPS Tunnel ได้ทันที
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// รวบรวม Endpoints ทั้งหมดของระบบหลังบ้าน (FastAPI Backend)
export const API_ENDPOINTS = {
  // 1. Endpoint ตรวจสอบสถานะความพร้อมของเซิร์ฟเวอร์
  health: `${API_BASE_URL}/health`,

  // 2. Endpoint ดึงรายชื่อนักเตะทั้งหมด (100 คน)
  players: `${API_BASE_URL}/api/players`,

  // 3. Endpoint ค้นหานักเตะด้วยระบบ Hybrid IR (รองรับ query, limit)
  search: (query, limit = 50) => 
    `${API_BASE_URL}/api/players/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`,

  // 4. Endpoint ดึงข้อมูลนักเตะรายบุคคลตาม ID
  playerById: (id) => `${API_BASE_URL}/api/players/${id}`,

  // 5. User Profiles API CRUD
  profiles: `${API_BASE_URL}/api/profiles`,
  profileById: (id) => `${API_BASE_URL}/api/profiles/${id}`,

  // 6. ลิงก์หน้าต่างเอกสาร Swagger API Documentation
  docs: `${API_BASE_URL}/docs`,
};
