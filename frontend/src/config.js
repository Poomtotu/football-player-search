export const API_BASE_URL = '';

export const API_ENDPOINTS = {
  health: '/api/health',
  players: '/api/players',
  search: (query, limit = 50) => `/api/players/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`,
  playerById: (id) => `/api/players/${id}`,
  profiles: '/api/profiles',
  profileById: (id) => `/api/profiles/${id}`,
  docs: '/docs',
};
