import React from 'react';
import { Trophy } from 'lucide-react';

const LEAGUES = [
  ['Premier League', 'อังกฤษ', '/images/league-logos/premier-league.svg', '#7c3aed'],
  ['La Liga', 'สเปน', '/images/league-logos/la-liga.svg', '#f97316'],
  ['Serie A', 'อิตาลี', '/images/league-logos/serie-a.svg', '#0ea5e9'],
  ['Bundesliga', 'เยอรมนี', '/images/league-logos/bundesliga.svg', '#ef4444'],
  ['Ligue 1', 'ฝรั่งเศส', '/images/league-logos/ligue-1.png', '#84cc16'],
  ['Saudi Pro League', 'ซาอุดีอาระเบีย', '/images/league-logos/saudi-pro-league.svg', '#22c55e'],
  ['Major League Soccer', 'สหรัฐอเมริกา', '/images/league-logos/mls.svg', '#2563eb'],
];

export function LeagueShowcase({ players, selectedLeague, onSelectLeague }) {
  const cards = LEAGUES.map(([league, country, logo, accent]) => ({
    league,
    country,
    logo,
    accent,
    count: players.filter((player) => player.current_league === league).length,
  }));

  return (
    <section id="leagues" className="motion-section sport-dark-section border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-white">
            <Trophy className="h-4 w-4 text-blue-400" />
            <h2 className="text-lg font-black">เลือกดูนักเตะตามลีก</h2>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">สำรวจนักเตะจากลีกชั้นนำในฐานข้อมูล</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {cards.map(({ league, country, count, logo, accent }, index) => (
            <button
              key={league}
              type="button"
              onClick={() => onSelectLeague(league)}
              className={`league-showcase-card league-logo-card motion-stagger-card group ${selectedLeague === league ? 'is-active' : ''}`}
              style={{
                '--motion-index': index,
                '--league-accent': accent,
              }}
            >
              <span className="league-logo-card-glow" aria-hidden="true" />
              <span className="league-logo-card-grid" aria-hidden="true" />

              <img
                src={logo}
                alt={`${league} logo`}
                className="league-logo-card-image"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />

              <div className="league-logo-card-copy">
                <div className="league-logo-card-title">{league}</div>
                <div className="league-logo-card-meta">
                  <span>{country}</span>
                  <span className="h-2.5 w-px bg-slate-600" aria-hidden="true" />
                  <span>{count} คน</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
