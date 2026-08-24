import { Activity, BookOpen, Database, Sparkles, Trophy } from 'lucide-react';
import { API_ENDPOINTS } from '../config';

export function Navbar({ backendReady, totalPlayers }) {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 bg-dark-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-neon-emerald flex items-center justify-center">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FOOTBALL<span className="text-emerald-400">.IR</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                BM25 + Fuzzy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ระบบค้นหาและจัดอันดับประวัตินักเตะระดับโลก
            </p>
          </div>
        </div>

        {/* Right Info & Status */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Database count */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-800 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>ฐานข้อมูล:</span>
            <span className="font-bold text-white">{totalPlayers || 100} คน</span>
          </div>

          {/* Backend Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              {backendReady && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${backendReady ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-slate-300 hidden sm:inline">
              API: <strong className={backendReady ? 'text-emerald-400' : 'text-rose-400'}>{backendReady ? 'Online' : 'Offline'}</strong>
            </span>
          </div>

          {/* API Docs Button */}
          <a
            href={API_ENDPOINTS.docs}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Swagger</span> API Docs
          </a>
        </div>
      </div>
    </header>
  );
}
