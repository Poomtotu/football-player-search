import React from 'react';
import { Database, Zap, Cpu, Award } from 'lucide-react';

export function StatsSummary({ totalShown, totalAll, query, searchTime }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-dark-800/60 border border-slate-800 text-xs">
        {/* Results count */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-400">
            {query ? (
              <>
                ผลการค้นหา: <strong className="text-emerald-400 font-extrabold text-sm">{totalShown}</strong> รายการ
                <span className="text-slate-500 ml-1.5 hidden sm:inline">(สำหรับ "{query}")</span>
              </>
            ) : (
              <>
                แสดงนักเตะยอดนิยม: <strong className="text-emerald-400 font-extrabold text-sm">{totalShown}</strong> จาก {totalAll} คน
              </>
            )}
          </span>
        </div>

        {/* IR Pipeline Info Badges */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          {searchTime !== null && (
            <span className="hidden md:inline-flex items-center text-slate-400">
              <Zap className="w-3 h-3 text-amber-400 mr-1" />
              ความเร็ว: <strong className="text-slate-200 ml-1">{searchTime} ms</strong>
            </span>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-dark-900 border border-slate-700 text-slate-300">
            <Cpu className="w-3 h-3 text-cyan-400 mr-1" />
            Okapi BM25 + RapidFuzz WRatio
          </span>
        </div>
      </div>
    </div>
  );
}
