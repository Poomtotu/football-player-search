import React, { useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Target, 
  Flame, 
  Flag, 
  Shield, 
  Sparkles, 
  Layers, 
  Award,
  Share2,
  Check
} from 'lucide-react';

export function PlayerModal({ player, onClose }) {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!player) return null;

  const stats = player.stats || { total_goals: 0, total_assists: 0, trophies_count: 0 };
  const national = player.national_team || { played: false, team_name: 'N/A', caps: 0, goals: 0 };
  const teamsHistory = player.teams_history || [];
  const aliases = player.aliases || [];
  const score = player.relevance_score;

  const totalContributions = (stats.total_goals || 0) + (stats.total_assists || 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?q=${encodeURIComponent(player.name_en)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Dark Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden z-10 animate-slide-up my-8">
        {/* Modal Top Banner */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-start justify-between">
          <div className="relative z-10">
            {score !== undefined && score !== null && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-blue-700 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>IR Relevance Score: {(score * 100).toFixed(1)}%</span>
              </span>
            )}
          </div>

          <div className="relative z-10 flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all text-xs flex items-center space-x-1"
              title="คัดลอกลิงก์นักเตะ"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Header Avatar & Info */}
        <div className="relative px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 sm:-mt-20 mb-6 gap-4 sm:gap-6">
            {/* Photo */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden flex-shrink-0 relative">
              {player.photo_url && player.photo_url !== 'N/A' ? (
                <img
                  src={player.photo_url}
                  alt={player.name_en}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                  <Shield className="w-12 h-12 text-blue-400/60 mb-1" />
                  <span className="text-xs font-bold uppercase">{player.name_en?.slice(0, 2)}</span>
                </div>
              )}
            </div>

            {/* Names & Clubs */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {player.name_th && player.name_th !== player.name_en ? player.name_th : player.name_en}
              </h2>
              <p className="text-sm font-semibold text-gray-500 mb-2">
                {player.name_en} {player.age > 0 && <span className="text-gray-400 font-normal">• อายุ {player.age} ปี</span>}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  {player.club_logo_url && player.club_logo_url !== 'N/A' ? (
                    <img
                      src={player.club_logo_url}
                      alt={player.current_team}
                      className="w-4 h-4 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>⚽</span>
                  )}
                  <span>{player.current_team}</span>
                </span>
                {player.current_league && player.current_league !== 'N/A' && (
                  <span className="px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium">
                    🏆 {player.current_league}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Aliases Section */}
          {aliases.length > 0 && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>ฉายาและชื่อเรียกอื่นๆ ({aliases.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {aliases.map((alias, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-white text-blue-700 border border-blue-200 text-xs font-medium shadow-sm"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Career Stats Cards Grid */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              สถิติการเล่นตลอดอาชีพ
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>ประตูรวม</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {stats.total_goals?.toLocaleString() || 0}
                </div>
                <span className="text-[10px] text-gray-400">ตลอดอาชีพ</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>แอสซิสต์รวม</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {stats.total_assists?.toLocaleString() || 0}
                </div>
                <span className="text-[10px] text-gray-400">ตลอดอาชีพ</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>ถ้วยรางวัล</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-600">
                  {stats.trophies_count || 0}
                </div>
                <span className="text-[10px] text-gray-400">แชมป์รวม</span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>มีส่วนร่วมประตู</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-indigo-600">
                  {totalContributions.toLocaleString()}
                </div>
                <span className="text-[10px] text-gray-400">Goals + Assists</span>
              </div>
            </div>
          </div>

          {/* National Team Section */}
          {national.played && national.team_name !== 'N/A' && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {player.flag_url && player.flag_url !== 'N/A' ? (
                    <img
                      src={player.flag_url}
                      alt={national.team_name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Flag className={`w-5 h-5 text-blue-600 ${player.flag_url && player.flag_url !== 'N/A' ? 'hidden' : ''}`} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 block">ทีมชาติ</span>
                  <span className="text-base font-bold text-gray-900">{national.team_name}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-gray-900">{national.caps} นัด</span>
                <span className="text-xs text-blue-600 font-bold block">{national.goals} ประตู</span>
              </div>
            </div>
          )}

          {/* Career Clubs Timeline */}
          {teamsHistory.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>เส้นทางอาชีพและสโมสรที่เคยค้าแข้ง</span>
              </div>
              
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {teamsHistory.map((team, idx) => {
                  const isCurrent = idx === teamsHistory.length - 1;
                  return (
                    <div key={idx} className="relative flex items-center justify-between text-xs">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        isCurrent ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-300'
                      }`}></span>

                      <span className={`font-semibold ${isCurrent ? 'text-blue-600 text-sm font-bold' : 'text-gray-700'}`}>
                        {team}
                      </span>
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                          ปัจจุบัน
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
