// ===========================================================================
// App.jsx — คอมโพเนนต์หลักของแอปพลิเคชัน (Main Container & State Management)
// ===========================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { StatsSummary } from './components/StatsSummary';
import { LeagueShowcase } from './components/LeagueShowcase';
import { PopularPlayers } from './components/PopularPlayers';
import { SearchFilters } from './components/SearchFilters';
import { PlayerCard } from './components/PlayerCard';
import { PlayerModal } from './components/PlayerModal';
import { SkeletonCard } from './components/SkeletonCard';
import { EmptyState } from './components/EmptyState';
import { ErrorNotification } from './components/ErrorNotification';

import { useDebounce } from './hooks/useDebounce';
import { API_ENDPOINTS } from './config';
import { ServerOff, RefreshCw } from 'lucide-react';

export default function App() {
  // --- States หลักของแอปพลิเคชัน ---

  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || ''); // ข้อความที่พิมพ์ในช่องค้นหา (อ่านจาก ?q= ถ้ามี)
  const debouncedQuery = useDebounce(query, 300);                           // ข้อความที่ผ่านการหน่วงเวลา 300ms
  const [selectedLeague, setSelectedLeague] = useState('ทั้งหมด');           // ลีกที่เลือกในแท็บฟิลเตอร์
  const [allPlayers, setAllPlayers] = useState([]);                         // รายชื่อนักเตะทั้งหมด
  const [filteredPlayers, setFilteredPlayers] = useState([]);               // รายชื่อนักเตะที่ผ่านการค้นหาและฟิลเตอร์
  const [loading, setLoading] = useState(true);                             // สถานะกำลังดึงข้อมูลจาก API
  const [selectedPlayer, setSelectedPlayer] = useState(null);               // ข้อมูลนักเตะที่เลือกเปิดใน Modal
  const [backendReady, setBackendReady] = useState(false);                   // สถานะความพร้อมของ Backend API
  const [backendError, setBackendError] = useState(null);                   // ข้อความข้อผิดพลาดเมื่อติดต่อ Backend ไม่ได้
  const [isRetrying, setIsRetrying] = useState(false);                       // สถานะกำลังลองเชื่อมต่อใหม่ (Retry)
  const [searchTime, setSearchTime] = useState(null);                       // เวลาที่ใช้ในการค้นหา (ms)

  // --- 1. ฟังก์ชันเช็กสถานะ Backend & ดึงรายชื่อนักเตะทั้งหมดเมื่อเริ่มต้น ---
  const checkHealthAndLoad = useCallback(async () => {
    setIsRetrying(true);
    setLoading(true);
    const startTime = performance.now();

    try {
      // 1.1 เช็กสถานะ Backend ก่อน
      const healthRes = await fetch(API_ENDPOINTS.health);
      if (!healthRes.ok) {
        throw new Error(`Backend Health Check Failed (${healthRes.status})`);
      }

      const healthData = await healthRes.json();
      if (healthData.status !== 'ok') {
        throw new Error('Backend is not ready');
      }

      setBackendReady(true);
      setBackendError(null);

      // 1.2 โหลดรายชื่อนักเตะทั้งหมดเฉพาะตอนเริ่มต้น/Retry
      const playersRes = await fetch(API_ENDPOINTS.players);
      if (!playersRes.ok) {
        throw new Error(`Failed to fetch players list (${playersRes.status})`);
      }

      const playersData = await playersRes.json();
      const playersList = playersData.players || playersData || [];
      setAllPlayers(playersList);

      setSearchTime(Math.round(performance.now() - startTime));
    } catch (err) {
      console.error('API Error:', err);
      setBackendReady(false);
      setBackendError(err);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  // รันเช็ก Health และโหลดข้อมูลครั้งแรกเมื่อเปิดหน้าเว็บเท่านั้น
  useEffect(() => {
    checkHealthAndLoad();
  }, [checkHealthAndLoad]);

  // --- 2. ฟังก์ชันยิง API ค้นหานักเตะเมื่อคำค้นหา (debouncedQuery) เปลี่ยนแปลง ---
  useEffect(() => {
    let isMounted = true;

    const performSearch = async () => {
      // กรณีช่องค้นหาเป็นค่าว่าง ให้แสดงรายการทั้งหมด
      if (!debouncedQuery.trim()) {
        let list = [...allPlayers];
        if (selectedLeague !== 'ทั้งหมด') {
          list = list.filter((p) => p.current_league === selectedLeague);
        }
        setFilteredPlayers(list);
        setSearchTime(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const startTime = performance.now();

      try {
        // ยิงคำค้นหาไปยัง /api/players/search?q=...
        const res = await fetch(API_ENDPOINTS.search(debouncedQuery));
        if (!res.ok) throw new Error(`Search request failed (${res.status})`);
        const data = await res.json();

        if (isMounted) {
          let results = data.results || [];

          // กรองต่อตามฟิลเตอร์ลีกที่เลือก
          if (selectedLeague !== 'ทั้งหมด') {
            results = results.filter((p) => p.current_league === selectedLeague);
          }

          setFilteredPlayers(results);
          setBackendError(null);
          setBackendReady(true);

          const endTime = performance.now();
          setSearchTime(Math.round(endTime - startTime));
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) {
          setBackendReady(false);
          setBackendError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedLeague, allPlayers]);

  // --- 3. ฟังก์ชันกรองนักเตะตามแท็บลีกเมื่อกดเลือกเปลี่ยนลีก ---
  useEffect(() => {
    if (!debouncedQuery.trim() && allPlayers.length > 0) {
      if (selectedLeague === 'ทั้งหมด') {
        setFilteredPlayers(allPlayers);
      } else {
        setFilteredPlayers(allPlayers.filter((p) => p.current_league === selectedLeague));
      }
    }
  }, [selectedLeague, allPlayers, debouncedQuery]);

  // --- 4. ฟังก์ชันจัดการฟิลเตอร์ลีก โดยคงคำค้นหาไว้เพื่อให้กรองผลลัพธ์ต่อได้ ---
  const handleSelectLeague = (league) => {
    setSelectedLeague(league);
  };

  // --- 5. ฟังก์ชันจัดการเมื่อผู้ใช้คลิกเลือกชิปคำแนะนำด่วน ---
  const handleSelectChip = (chipLabel) => {
    setSelectedLeague('ทั้งหมด');
    setQuery(chipLabel);
  };

  // --- 6. ฟังก์ชันรีเซ็ตคำค้นหาและฟิลเตอร์ทั้งหมด ---
  const handleReset = () => {
    setQuery('');
    setSelectedLeague('ทั้งหมด');
  };

  const featuredPlayer =
    allPlayers.find((player) => player.name_en === 'Erling Haaland') ||
    allPlayers.find((player) => player.name_en === 'Kylian Mbappé') ||
    allPlayers[0] ||
    null;

  const isSearchMode = Boolean(
    debouncedQuery.trim() || selectedLeague !== 'ทั้งหมด'
  );

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-900 selection:bg-blue-600 selection:text-white bg-[var(--app-bg)]">
      <div>
        {/* แถบ Header ข้างบน */}
        <Navbar
          backendReady={backendReady}
          totalPlayers={allPlayers.length}
          onResetSearch={handleReset}
          isSearchMode={isSearchMode}
        />

        {/* ส่วนค้นหานักเตะและผลลัพธ์ IR */}
            {/* ส่วน Hero และช่องค้นหาหลัก */}
            <HeroSearch
              query={query}
              setQuery={setQuery}
              loading={loading}
              onSelectChip={handleSelectChip}
              featuredPlayer={featuredPlayer}
              players={allPlayers}
              onOpenModal={setSelectedPlayer}
              totalPlayers={allPlayers.length}
              compact={isSearchMode}
            />

            {!isSearchMode && (
              <>
                <LeagueShowcase
                  players={allPlayers}
                  selectedLeague={selectedLeague}
                  onSelectLeague={handleSelectLeague}
                />
                <PopularPlayers
                  players={allPlayers}
                  onOpenModal={setSelectedPlayer}
                />
              </>
            )}

            {isSearchMode && (
              <SearchFilters
                players={allPlayers}
                selectedLeague={selectedLeague}
                onSelectLeague={handleSelectLeague}
              />
            )}

            {/* แบนเนอร์แจ้งเตือนแบบ In-page กรณีติดต่อเซิร์ฟเวอร์ไม่ได้ */}
            {backendError && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in">
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-700 text-xs sm:text-sm shadow-sm">
                  <div className="flex items-center space-x-3 text-center sm:text-left">
                    <ServerOff className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>
                      <strong className="text-gray-900">ระบบหลังบ้านขัดข้อง:</strong> {backendError.message}
                    </span>
                  </div>
                  <button
                    onClick={checkHealthAndLoad}
                    disabled={isRetrying}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? 'กำลังลองใหม่...' : 'ลองใหม่ (Retry)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* จุดเลื่อนของเมนู "นักเตะทั้งหมด" ให้อยู่ก่อนหัวข้อสรุปผลลัพธ์ */}
            <div id="players" className="player-results-anchor" aria-hidden="true" />

            {/* แถบสรุปผลลัพธ์การค้นหาและความเร็ว (ms) */}
            {!loading && !backendError && (
              <StatsSummary
                totalShown={filteredPlayers.length}
                totalAll={allPlayers.length}
                query={debouncedQuery}
                searchTime={searchTime}
                selectedLeague={selectedLeague}
              />
            )}

            {/* ตารางแสดงผลการ์ดนักเตะ (Player Cards Grid) */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              {loading ? (
                /* แสดง Skeleton Loading ระหว่างรอข้อมูล */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredPlayers.length > 0 ? (
                /* แสดงการ์ดนักเตะจริง */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6 animate-fade-in">
                  {filteredPlayers.map((player, index) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      index={index}
                      query={debouncedQuery}
                      onOpenModal={setSelectedPlayer}
                    />
                  ))}
                </div>
              ) : (
                /* แสดง Empty State เมื่อค้นหาไม่พบข้อมูล */
                <EmptyState
                  query={debouncedQuery}
                  onReset={handleReset}
                  onSelectChip={handleSelectChip}
                />
              )}
            </main>

      </div>

      {/* Toast แจ้งเตือนข้อผิดพลาดลอยมุมขวาล่าง */}
      <ErrorNotification
        error={backendError}
        onRetry={checkHealthAndLoad}
        onDismiss={() => setBackendError(null)}
        isRetrying={isRetrying}
      />

      {/* หน้าต่างป๊อปอัป Modal แสดงรายละเอียดนักเตะฉบับเต็ม */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

    </div>
  );
}
