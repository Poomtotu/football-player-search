import React from 'react';
import { Zap } from 'lucide-react';

export function StatsSummary({
  totalShown,
  totalAll,
  query,
  searchTime,
  selectedLeague = 'ทั้งหมด',
}) {
  const hasLeagueFilter = selectedLeague !== 'ทั้งหมด';

  return (
    <div className="results-summary-enter mx-auto max-w-7xl px-4 pb-5 pt-7 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-blue-600">
            {query ? 'Search results' : hasLeagueFilter ? 'League players' : 'Player directory'}
          </p>
          <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {query ? (
              <>พบ {totalShown} รายการสำหรับ “{query}”</>
            ) : hasLeagueFilter ? (
              <span className="inline-flex items-center gap-2.5">
                <span>{selectedLeague}</span>
                <span className="h-5 w-px bg-slate-300" aria-hidden="true" />
                <span className="text-slate-500">{totalShown} นักเตะ</span>
              </span>
            ) : (
              <>นักฟุตบอลทั้งหมด {totalShown} คน</>
            )}
          </h2>
          {query && hasLeagueFilter ? (
            <p className="mt-1 text-xs text-slate-500">
              กรองผลลัพธ์เฉพาะ {selectedLeague}
            </p>
          ) : !query && !hasLeagueFilter && totalAll > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              ข้อมูลทั้งหมดในฐานข้อมูล {totalAll} คน
            </p>
          ) : null}
        </div>

        {searchTime !== null && (
          <div className="hidden items-center gap-1.5 pb-0.5 text-xs text-slate-500 sm:flex">
            <Zap className="h-3.5 w-3.5" />
            <span>{searchTime} ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
