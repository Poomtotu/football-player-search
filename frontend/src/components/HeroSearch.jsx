import React from 'react';
import { Search, X, Loader2, Sparkles } from 'lucide-react';

export function HeroSearch({
  query,
  setQuery,
  loading,
  selectedLeague,
  setSelectedLeague,
  totalResults,
  onSelectChip
}) {
  const quickTags = [
    { label: 'เมสซี่', icon: '🔥', desc: 'ชื่อไทย' },
    { label: 'CR7', icon: '⚡', desc: 'ฉายา' },
    { label: 'จอมมารบลู', icon: '🤖', desc: 'ฉายาไทย' },
    { label: 'บังโม', icon: '👑', desc: 'ฉายาไทย' },
    { label: 'ยามาล', icon: '🇪🇸', desc: 'ดาวรุ่ง' },
    { label: 'LM10', icon: '🐐', desc: 'ฉายา' },
    { label: 'Real Madrid', icon: '⚽', desc: 'สโมสร' },
    { label: 'messy', icon: '⌨️', desc: 'ทดสอบพิมพ์ผิด' },
    { label: 'roanaldo', icon: '⌨️', desc: 'ทดสอบพิมพ์ผิด' },
  ];

  const leagues = [
    'ทั้งหมด',
    'Premier League',
    'La Liga',
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    'Saudi Pro League',
    'Major League Soccer',
  ];

  return (
    <div className="relative pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      {/* IR Pipeline Badge */}
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 mb-4 animate-fade-in shadow-clean-sm">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>Information Retrieval System (BM25 + RapidFuzz Typo-Tolerant)</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 mb-3">
        ค้นหาประวัติ<span className="text-blue-600">นักฟุตบอล</span>ระดับโลก
      </h1>
      <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-8 font-normal">
        ค้นหาได้ทั้งชื่อภาษาไทย ภาษาอังกฤษ และฉายา แม้จะพิมพ์ผิด ระบบ IR จะคำนวณ <span className="text-blue-600 font-semibold">relevance_score</span> จัดอันดับความเกี่ยวข้องทันที
      </p>

      {/* Large Search Bar */}
      <div className="relative max-w-3xl mx-auto mb-5">
        <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl shadow-clean p-2 sm:p-2.5 transition-all focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
          <div className="pl-3 pr-2 flex items-center">
            {loading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อนักเตะ, ฉายา เช่น เมสซี่, CR7, จอมมารบลู, messy (พิมพ์ผิด)..."
            className="w-full bg-transparent text-gray-900 text-base sm:text-lg placeholder-gray-400 focus:outline-none px-2 py-1.5 font-medium"
            autoFocus
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors mr-1"
              title="ล้างคำค้นหา"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="hidden sm:flex items-center pr-2">
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg">
              Debounce 300ms
            </span>
          </div>
        </div>
      </div>

      {/* Quick Search Suggestions Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs">
        <span className="text-gray-500 text-[11px] font-medium mr-1">ลองค้นหา:</span>
        {quickTags.map((tag) => (
          <button
            key={tag.label}
            onClick={() => onSelectChip(tag.label)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs font-medium shadow-clean-sm"
          >
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
          </button>
        ))}
      </div>

      {/* League Filter Tabs */}
      <div className="flex items-center justify-center space-x-1.5 overflow-x-auto pb-2 max-w-full">
        {leagues.map((league) => {
          const isActive = selectedLeague === league;
          return (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 shadow-clean-sm'
              }`}
            >
              {league}
            </button>
          );
        })}
      </div>
    </div>
  );
}
