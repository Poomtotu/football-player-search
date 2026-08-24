import React from 'react';
import { Search, X, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';

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
    <div className="relative pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      {/* Badge */}
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4 animate-fade-in">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Information Retrieval System (BM25 + RapidFuzz Typo-Tolerant)</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
        ค้นหาประวัติ<span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">นักฟุตบอล</span>ระดับโลก
      </h1>
      <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8">
        ค้นหาได้ทั้งชื่อภาษาไทย ภาษาอังกฤษ และฉายา แม้จะพิมพ์ผิด ระบบ IR จะคำนวณ <span className="text-emerald-400 font-semibold">relevance_score</span> จัดอันดับความเกี่ยวข้องทันที
      </p>

      {/* Large Search Bar */}
      <div className="relative max-w-3xl mx-auto mb-5 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500 group-focus-within:opacity-75"></div>
        
        <div className="relative flex items-center bg-dark-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 sm:p-2.5 transition-all group-focus-within:border-emerald-500/80 group-focus-within:ring-2 group-focus-within:ring-emerald-500/30">
          <div className="pl-3 pr-2 text-slate-400 flex items-center">
            {loading ? (
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อนักเตะ, ฉายา เช่น เมสซี่, CR7, จอมมารบลู, messy (พิมพ์ผิด)..."
            className="w-full bg-transparent text-white text-base sm:text-lg placeholder-slate-500 focus:outline-none px-2 py-1.5 font-medium"
            autoFocus
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/50 transition-colors mr-1"
              title="ล้างคำค้นหา"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="hidden sm:flex items-center pr-2">
            <span className="text-[11px] font-semibold text-slate-400 bg-dark-900/90 border border-slate-700 px-2 py-1 rounded-lg">
              Debounce 300ms
            </span>
          </div>
        </div>
      </div>

      {/* Quick Search Suggestions Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs">
        <span className="text-slate-500 text-[11px] font-medium mr-1">ลองค้นหา:</span>
        {quickTags.map((tag) => (
          <button
            key={tag.label}
            onClick={() => onSelectChip(tag.label)}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-dark-800/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs font-medium"
          >
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
          </button>
        ))}
      </div>

      {/* League Filter Tabs */}
      <div className="flex items-center justify-center space-x-1 overflow-x-auto pb-2 scrollbar-none max-w-full">
        {leagues.map((league) => {
          const isActive = selectedLeague === league;
          return (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500 text-dark-900 font-bold shadow-neon-emerald'
                  : 'bg-dark-800/60 hover:bg-dark-700 text-slate-400 hover:text-slate-200 border border-slate-800/80'
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
