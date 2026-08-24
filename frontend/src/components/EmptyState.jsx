import React from 'react';
import { SearchX, Sparkles, RefreshCw } from 'lucide-react';

export function EmptyState({ query, onReset, onSelectChip }) {
  const suggestions = ['เมสซี่', 'CR7', 'ฮาลันด์', 'ซาลาห์', 'เอ็มบัปเป', 'Real Madrid'];

  return (
    <div className="max-w-md mx-auto my-12 text-center p-8 rounded-3xl glass-card border border-slate-800 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
        <SearchX className="w-8 h-8 text-amber-400" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        ไม่พบผลการค้นหา
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 mb-6">
        ไม่พบนักเตะที่ตรงกับคำว่า <span className="text-emerald-400 font-semibold">"{query}"</span><br />
        ลองค้นหาด้วยชื่อย่อ, ฉายา หรือชื่อสโมสรแทน
      </p>

      {/* Suggested Keywords */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-center space-x-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>ลองค้นหาคำเหล่านี้:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => onSelectChip(item)}
              className="px-3 py-1 rounded-full bg-slate-800 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/30 text-xs font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-dark-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>ดูนักเตะทั้งหมด</span>
      </button>
    </div>
  );
}
