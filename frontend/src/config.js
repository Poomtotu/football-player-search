export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const withApiBase = (path) => `${API_BASE_URL}${path}`;

export const API_ENDPOINTS = {
  health: withApiBase('/api/health'),
  players: withApiBase('/api/players'),
  search: (query, limit = 50, league = '') => {
    const params = new URLSearchParams({ q: query.trim(), limit: String(limit) });
    if (league && league !== 'ทั้งหมด') params.set('league', league);
    return withApiBase(`/api/players/search?${params.toString()}`);
  },
  playerById: (id) => withApiBase(`/api/players/${id}`),
};
