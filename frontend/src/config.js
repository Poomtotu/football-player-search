export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const withApiBase = (path) => `${API_BASE_URL}${path}`;

export const API_ENDPOINTS = {
  health: withApiBase('/api/health'),
  players: withApiBase('/api/players'),
  search: (query, limit = 50) => withApiBase(`/api/players/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`),
  playerById: (id) => withApiBase(`/api/players/${id}`),
};
