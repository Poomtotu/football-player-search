import React, { useState } from 'react';
import { 
  Trophy, 
  Target, 
  Sparkles, 
  Shield, 
  Flag, 
  ChevronRight, 
  Calendar, 
  Flame,
  Award,
  Layers
} from 'lucide-react';

export function PlayerCard({ player, onOpenModal }) {
  const [imgError, setImgError] = useState(false);

  const stats = player.stats || { total_goals: 0, total_assists: 0, trophies_count: 0 };
  const national = player.national_team || { played: false, team_name: 'N/A', caps: 0, goals: 0 };
  const teamsHistory = player.teams_history || [];
  const aliases = player.aliases || [];
  const score = player.relevance_score;

  // Relevance Score Color & Text
  const getScoreBadge = () => {
    if (score === undefined || score === null) return null;
    const percentage = Math.round(score * 100);

    let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    let iconColor = 'text-emerald-400';
    if (score < 0.5) {
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      iconColor = 'text-amber-400';
    } else if (score < 0.8) {
      colorClasses = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      iconColor = 'text-cyan-400';
    }

    return (
      <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClasses} shadow-sm`}>
        <Sparkles className={`w-3 h-3 ${iconColor}`} />
        <span>Match: {percentage}%</span>
        <span className="text-[10px] opacity-75 font-normal">({score.toFixed(3)})</span>
      </div>
    );
  };

  return (
    <div 
      onClick={() => onOpenModal(player)}
      className="group relative glass-card rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
    >
      {/* Background ambient glow on hover */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none"></div>

      <div>
        {/* Card Top: Photo, Names, Relevance */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3.5">
            {/* Player Avatar */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-900 border border-slate-700/80 overflow-hidden flex-shrink-0 shadow-lg group-hover:border-emerald-500/50 transition-colors">
              {player.photo_url && player.photo_url !== 'N/A' && !imgError ? (
                <img
                  src={player.photo_url}
                  alt={player.name_en}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-dark-900 text-slate-400">
                  <Shield className="w-7 h-7 text-emerald-400/60 mb-0.5" />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                    {player.name_en?.slice(0, 2) || 'FB'}
                  </span>
                </div>
              )}
              {/* Age pill on avatar */}
              {player.age > 0 && (
                <span className="absolute bottom-1 right-1 bg-dark-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700">
                  {player.age} ปี
                </span>
              )}
            </div>

            {/* Names & Club */}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                {player.name_th && player.name_th !== player.name_en ? player.name_th : player.name_en}
              </h3>
              <p className="text-xs font-semibold text-slate-400 truncate mb-1">
                {player.name_en}
              </p>
              
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 font-medium truncate max-w-[150px]">
                  {player.club_logo_url && player.club_logo_url !== 'N/A' ? (
                    <img
                      src={player.club_logo_url}
                      alt={player.current_team}
                      className="w-3.5 h-3.5 object-contain flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-xs">⚽</span>
                  )}
                  <span className="truncate">{player.current_team}</span>
                </span>
                {player.current_league && player.current_league !== 'N/A' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-dark-900/80 border border-slate-800 text-slate-400 text-[10px]">
                    {player.current_league}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Relevance Match Badge */}
          {getScoreBadge()}
        </div>

        {/* Aliases Tags */}
        {aliases.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-3.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">ฉายา:</span>
            {aliases.slice(0, 3).map((alias, i) => (
              <span 
                key={i} 
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/50 text-emerald-400/90 font-medium"
              >
                {alias}
              </span>
            ))}
            {aliases.length > 3 && (
              <span className="text-[10px] text-slate-500">+{aliases.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats Dashboard 3-Column Box */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-dark-800/80 border border-slate-800/80 rounded-xl p-2.5 text-center group-hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase">ประตู</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-white">
              {stats.total_goals?.toLocaleString() || 0}
            </span>
          </div>

          <div className="bg-dark-800/80 border border-slate-800/80 rounded-xl p-2.5 text-center group-hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase">แอสซิสต์</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-white">
              {stats.total_assists?.toLocaleString() || 0}
            </span>
          </div>

          <div className="bg-dark-800/80 border border-slate-800/80 rounded-xl p-2.5 text-center group-hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-semibold uppercase">ถ้วยรางวัล</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-amber-400">
              {stats.trophies_count || 0}
            </span>
          </div>
        </div>

        {/* National Team Badge */}
        {national.played && national.team_name !== 'N/A' && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-dark-800/50 border border-slate-800 text-xs mb-3">
            <div className="flex items-center space-x-2 text-slate-300 min-w-0">
              {player.flag_url && player.flag_url !== 'N/A' ? (
                <img
                  src={player.flag_url}
                  alt={national.team_name}
                  className="w-4 h-3 object-cover rounded-sm shadow-sm flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <Flag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              )}
              <span className="font-semibold truncate">{national.team_name}</span>
            </div>
            <span className="text-slate-400 text-[11px] flex-shrink-0 ml-2">
              {national.caps} นัด / <strong className="text-emerald-400 font-bold">{national.goals}</strong> ประตู
            </span>
          </div>
        )}

        {/* Career Timeline / Clubs Badges */}
        {teamsHistory.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center space-x-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>ประวัติสโมสร ({teamsHistory.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {teamsHistory.map((team, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-dark-800 text-slate-300 border border-slate-800"
                >
                  {team}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Click CTA */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-400 transition-colors mt-2">
        <span className="text-[11px] font-medium">ดูรายละเอียดฉบับเต็ม</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
