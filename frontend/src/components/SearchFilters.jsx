import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

const LEAGUES = [
  'ทั้งหมด',
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Saudi Pro League',
  'Major League Soccer',
];

export function SearchFilters({ players, selectedLeague, onSelectLeague }) {
  const countFor = (league) => {
    if (league === 'ทั้งหมด') return players.length;
    return players.filter((player) => player.current_league === league).length;
  };

  return (
    <div id="leagues" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 overflow-x-auto py-3">
          <div className="flex flex-shrink-0 items-center gap-2 border-r border-slate-200 pr-4 text-xs font-bold text-slate-700">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            กรองตามลีก
          </div>

          <div className="flex min-w-max items-center gap-1.5">
            {LEAGUES.map((league) => {
              const active = selectedLeague === league;

              return (
                <button
                  key={league}
                  type="button"
                  onClick={() => onSelectLeague(league)}
                  aria-pressed={active}
                  className={`search-filter-tab ${active ? 'is-active' : ''}`}
                >
                  {active && (
                    <span className="search-filter-check" aria-hidden="true">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  <span>{league}</span>
                  <span className="search-filter-count">{countFor(league)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
