// config.js — API Configuration (Relative URL support for Cloudflare HTTPS & LAN)
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  players: `${API_BASE_URL}/api/players`,
  search: (query, limit = 50) => 
    `${API_BASE_URL}/api/players/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`,
  playerById: (id) => `${API_BASE_URL}/api/players/${id}`,
  docs: `${API_BASE_URL}/docs`,
};
