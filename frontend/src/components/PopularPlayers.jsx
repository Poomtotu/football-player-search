import React from 'react';
import { Flame } from 'lucide-react';

const PREFERRED_NAMES = [
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Erling Haaland',
  'Kylian Mbappé',
  'Mohamed Salah',
  'Vinícius Júnior',
];

export function PopularPlayers({ players, onOpenModal }) {
  const preferred = PREFERRED_NAMES
    .map((name) => players.find((player) => player.name_en === name))
    .filter(Boolean);

  const fallback = players.filter((player) => !preferred.includes(player));
  const popular = [...preferred, ...fallback].slice(0, 6);

  if (!popular.length) return null;

  return (
    <section id="popular" className="motion-section sport-dark-section border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 pb-7 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <Flame className="h-4 w-4 text-orange-400" />
              <h2 className="text-lg font-black">นักเตะยอดนิยม</h2>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">นักเตะเด่นจากฐานข้อมูลที่เข้าถึงได้อย่างรวดเร็ว</p>
          </div>
          <a href="#players" className="text-[11px] font-bold text-blue-400 hover:text-blue-300">
            ดูนักเตะทั้งหมด →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {popular.map((player, index) => (
            <button
              type="button"
              key={player.id}
              onClick={() => onOpenModal(player)}
              className="popular-player-card motion-stagger-card group"
              style={{ '--motion-index': index }}
            >
              <div className="relative h-[116px] overflow-hidden rounded-t-md bg-slate-900">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={player.name_en}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071427] via-transparent to-transparent" />
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/55 text-[10px] font-black text-white backdrop-blur">
                  {index + 1}
                </span>
              </div>

              <div className="p-3 text-left">
                <div className="truncate text-[11px] font-extrabold text-white">{player.name_en}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                  {player.flag_url && <img src={player.flag_url} alt="" className="h-3 w-4 rounded-[2px] object-cover" />}
                  <span className="truncate">{player.national_team?.team_name || 'International'}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-slate-300">
                  {player.club_logo_url && (
                    <img src={player.club_logo_url} alt="" referrerPolicy="no-referrer" className="h-3.5 w-3.5 object-contain" />
                  )}
                  <span className="truncate">{player.current_team}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
