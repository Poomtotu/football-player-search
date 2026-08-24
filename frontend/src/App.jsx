import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { PlayerCard } from './components/PlayerCard';
import { PlayerModal } from './components/PlayerModal';
import { SkeletonCard } from './components/SkeletonCard';
import { EmptyState } from './components/EmptyState';
import { StatsSummary } from './components/StatsSummary';
import { ErrorNotification } from './components/ErrorNotification';
import { useDebounce } from './hooks/useDebounce';
import { API_ENDPOINTS, API_BASE_URL } from './config';
import { Trophy, AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('ทั้งหมด');
  const [backendReady, setBackendReady] = useState(false);
  const [searchTime, setSearchTime] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 1. Check Backend Health & Fetch initial data
  const checkHealthAndLoad = useCallback(async () => {
    setIsRetrying(true);
    try {
      const healthRes = await fetch(API_ENDPOINTS.health, { signal: AbortSignal.timeout(4000) });
      if (!healthRes.ok) throw new Error(`Health check returned status ${healthRes.status}`);
      
      const healthData = await healthRes.json();
      setBackendReady(healthData.index_ready);

      const playersRes = await fetch(API_ENDPOINTS.players, { signal: AbortSignal.timeout(6000) });
      if (!playersRes.ok) throw new Error(`Fetch players returned status ${playersRes.status}`);

      const playersData = await playersRes.json();
      const list = playersData.players || [];
      setAllPlayers(list);
      if (!query.trim()) {
        setPlayers(list);
      }
      setBackendError(null);
    } catch (err) {
      console.error('Backend connection error:', err);
      setBackendReady(false);
      setBackendError({
        message: `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend (${API_BASE_URL || 'http://localhost:8000'}) ได้ กรุณาตรวจสอบว่ารัน backend อยู่หรือไม่`,
      });
    } finally {
      setIsRetrying(false);
      setLoading(false);
    }
  }, [query]);

  // Initial load
  useEffect(() => {
    checkHealthAndLoad();
  }, [checkHealthAndLoad]);

  // Periodic Health check poll (every 20s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetch(API_ENDPOINTS.health, { signal: AbortSignal.timeout(3000) })
        .then((res) => {
          if (res.ok) {
            setBackendReady(true);
            setBackendError(null);
          } else {
            setBackendReady(false);
          }
        })
        .catch(() => {
          setBackendReady(false);
        });
    }, 20000);

    return () => clearInterval(timer);
  }, []);

  // 2. Perform Search on debounced query
  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setPlayers(allPlayers);
        setSearchTime(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const startTime = performance.now();

      try {
        const url = API_ENDPOINTS.search(debouncedQuery.trim(), 50);
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        
        if (!res.ok) {
          throw new Error(`ค้นหาล้มเหลว (HTTP ${res.status})`);
        }

        const data = await res.json();
        setPlayers(data.results || []);
        setBackendError(null);
        setBackendReady(true);
      } catch (err) {
        console.error('Search request failed:', err);
        setPlayers([]);
        setBackendError({
          message: `ไม่สามารถดำเนินการค้นหาได้: ${err.message || 'การเชื่อมต่อขัดข้อง'}`,
        });
      } finally {
        const endTime = performance.now();
        setSearchTime(Math.round(endTime - startTime));
        setLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery, allPlayers]);

  // 3. Filter players by selected league
  const filteredPlayers = useMemo(() => {
    if (selectedLeague === 'ทั้งหมด') {
      return players;
    }
    return players.filter(
      (p) => p.current_league && p.current_league.toLowerCase().includes(selectedLeague.toLowerCase())
    );
  }, [players, selectedLeague]);

  const handleSelectChip = (tag) => {
    setQuery(tag);
  };

  const handleReset = () => {
    setQuery('');
    setSelectedLeague('ทั้งหมด');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-gray-900 selection:bg-blue-600 selection:text-white bg-slate-50">
      <div>
        {/* Navbar */}
        <Navbar 
          backendReady={backendReady} 
          totalPlayers={allPlayers.length} 
        />

        {/* Hero & Search Bar Section */}
        <HeroSearch
          query={query}
          setQuery={setQuery}
          loading={loading}
          selectedLeague={selectedLeague}
          setSelectedLeague={setSelectedLeague}
          totalResults={filteredPlayers.length}
          onSelectChip={handleSelectChip}
        />

        {/* In-page Error Banner if Backend is offline */}
        {backendError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-700 text-xs sm:text-sm shadow-sm">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <ServerOff className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>
                  <strong className="text-gray-900">ระบบหลังบ้านขัดข้อง:</strong> {backendError.message}
                </span>
              </div>
              <button
                onClick={checkHealthAndLoad}
                disabled={isRetrying}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'กำลังลองใหม่...' : 'ลองใหม่ (Retry)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary Bar */}
        {!loading && !backendError && (
          <StatsSummary
            totalShown={filteredPlayers.length}
            totalAll={allPlayers.length}
            query={debouncedQuery}
            searchTime={searchTime}
          />
        )}

        {/* Main Content: Player Cards Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredPlayers.length > 0 ? (
            /* Player Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onOpenModal={setSelectedPlayer}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <EmptyState
              query={debouncedQuery}
              onReset={handleReset}
              onSelectChip={handleSelectChip}
            />
          )}
        </main>
      </div>

      {/* Floating Error Notification Toast */}
      <ErrorNotification
        error={backendError}
        onRetry={checkHealthAndLoad}
        onDismiss={() => setBackendError(null)}
        isRetrying={isRetrying}
      />

      {/* Full Details Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-gray-800">Football Player Information Retrieval System</span>
          </div>
          <div>
            Powered by <strong className="text-blue-600">FastAPI</strong> + <strong className="text-indigo-600">BM25Okapi</strong> + <strong className="text-cyan-600">RapidFuzz</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
