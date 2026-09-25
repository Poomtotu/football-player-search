import React, { useState } from 'react';
import { ChevronRight, Shield } from 'lucide-react';

export const PlayerCard = React.memo(function PlayerCard({ player, onOpenModal, index = 0, query = '' }) {
  const [imgError, setImgError] = useState(false);

  const highlightText = React.useCallback((value) => {
    const text = String(value || '');
    const needle = String(query || '').trim();
    if (!needle || needle.length < 2) return text;

    const lowerText = text.toLocaleLowerCase();
    const lowerNeedle = needle.toLocaleLowerCase();
    const start = lowerText.indexOf(lowerNeedle);
    if (start === -1) return text;

    return (
      <>
        {text.slice(0, start)}
        <mark className="search-highlight">
          {text.slice(start, start + needle.length)}
        </mark>
        {text.slice(start + needle.length)}
      </>
    );
  }, [query]);

  React.useEffect(() => {
    setImgError(false);
  }, [player?.photo_url]);

  const stats = player.stats || {
    total_goals: 0,
    total_assists: 0,
    trophies_count: 0,
  };
  const national = player.national_team || {
    played: false,
    team_name: 'N/A',
    caps: 0,
    goals: 0,
  };
  const profileSummary = player.profile_summary || '';
  const strengths = Array.isArray(player.strengths)
    ? player.strengths.filter(Boolean)
    : [];
  const matchPercentage = player.match_percentage;
  const renderMatch = () => {
    if (matchPercentage === undefined || matchPercentage === null) return null;

    const percentage = Number(matchPercentage.toFixed(1));
    const tone =
      matchPercentage >= 80
        ? 'text-emerald-700'
        : matchPercentage >= 60
          ? 'text-blue-700'
          : 'text-amber-700';

    return (
      <div className="text-right flex-shrink-0">
        <div className="text-[9px] uppercase tracking-[0.14em] font-bold text-slate-500">Match</div>
        <div className={`mt-0.5 text-sm font-black ${tone}`}>{percentage}%</div>
      </div>
    );
  };

  return (
    <article
      onClick={() => onOpenModal(player)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }}
      className="player-card reveal-card group cursor-pointer rounded-lg border border-slate-200 bg-white p-5
                 shadow-[0_1px_2px_rgba(15,23,42,0.03)]
                 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300
                 hover:shadow-[0_12px_26px_-22px_rgba(37,99,235,0.28)] active:scale-[0.996]"
      style={{ animationDelay: `${Math.min(index, 10) * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="player-photo relative w-[72px] h-[72px] rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
            {player.photo_url && player.photo_url !== 'N/A' && !imgError ? (
              <img
                src={player.photo_url}
                alt={player.name_en}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <Shield className="w-6 h-6 text-slate-500" />
              </div>
            )}
          </div>

          <div className="min-w-0 pt-0.5">
            <h3 className="text-[17px] font-black tracking-tight text-slate-950 leading-snug">
              {highlightText(
                player.name_th && player.name_th !== player.name_en
                  ? player.name_th
                  : player.name_en
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{highlightText(player.name_en)}</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{player.primary_position || 'Footballer'}</span>
              {player.age > 0 && (
                <>
                  <span className="h-3 w-px bg-slate-300" aria-hidden="true" />
                  <span>{player.age} ปี</span>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 min-w-0">
              {player.club_logo_url && player.club_logo_url !== 'N/A' && (
                <img
                  src={player.club_logo_url}
                  alt={player.current_team}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 object-contain flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <span className="text-xs font-semibold text-slate-700 truncate">
                {highlightText(player.current_team)}
              </span>

            </div>
          </div>
        </div>
        {renderMatch()}
      </div>
      {(profileSummary || strengths.length > 0) && (
        <div className="border-t border-slate-100 pt-4 mb-4">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-blue-600 mb-2">
            สไตล์การเล่น
          </p>
          {profileSummary && (
            <p className="text-[12px] leading-5 text-slate-600 line-clamp-2">
              {profileSummary}
            </p>
          )}
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
              {strengths.slice(0, 3).map((item, i) => (
                <span
                  key={`${item}-${i}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 border-y border-slate-100 py-3.5 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Goals</p>
          <p className="stat-value mt-1 text-base font-black text-slate-900">
            {stats.total_goals?.toLocaleString() || 0}
          </p>
        </div>
        <div className="border-l border-slate-100 pl-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Assists</p>
          <p className="stat-value mt-1 text-base font-black text-slate-900">
            {stats.total_assists?.toLocaleString() || 0}
          </p>
        </div>
        <div className="border-l border-slate-100 pl-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Trophies</p>
          <p className="stat-value mt-1 text-base font-black text-slate-900">
            {stats.trophies_count || 0}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs text-slate-500">
          {national.played && national.team_name !== 'N/A' ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{highlightText(national.team_name)}</span>
              <span className="h-3 w-px flex-shrink-0 bg-slate-300" aria-hidden="true" />
              <span className="flex-shrink-0">{national.caps} นัด</span>
            </span>
          ) : (
            <span>ข้อมูลนักเตะ</span>
          )}
        </div>

        <div className="profile-link card-action inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 group-hover:text-blue-600">
          <span>ดูโปรไฟล์</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
});
