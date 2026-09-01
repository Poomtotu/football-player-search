// ===========================================================================
// PlayerCard.jsx — คอมโพเนนต์การ์ดแสดงข้อมูลนักเตะ (Player Card Component)
// ===========================================================================

import React, { useState } from 'react';
import { 
  Trophy, 
  Target, 
  Sparkles, 
  Shield, 
  Flag, 
  ChevronRight, 
  Flame,
  Layers
} from 'lucide-react';

/**
 * คอมโพเนนต์ PlayerCard แสดงรูปถ่าย, ชื่อไทย/อังกฤษ, โลโก้สโมสร, รูปธงชาติ, คะแนน Relevance Match %,
 * สถิติประตู/แอสซิสต์/ถ้วยรางวัล 3 ช่อง และประวัติสโมสร
 * 
 * @param {object} player - ข้อมูลนักเตะ 1 คน
 * @param {function} onOpenModal - ฟังก์ชันเมื่อคลิกเปิดป๊อปอัป Modal ดูรายละเอียดเต็ม
 */
export const PlayerCard = React.memo(function PlayerCard({ player, onOpenModal }) {
  // State จัดการกรณีรูปภาพโหลดไม่ผ่าน (Image Load Error Fallback)
  const [imgError, setImgError] = useState(false);

  // รีเซ็ต imgError เมื่อรูปภาพนักเตะเปลี่ยน
  React.useEffect(() => {
    setImgError(false);
  }, [player?.photo_url]);

  // ดึงสถิติและข้อมูลย่อยพร้อมตั้งค่า default ป้องกัน crash
  const stats = player.stats || { total_goals: 0, total_assists: 0, trophies_count: 0 };
  const national = player.national_team || { played: false, team_name: 'N/A', caps: 0, goals: 0 };
  const teamsHistory = player.teams_history || [];
  const aliases = player.aliases || [];
  const score = player.relevance_score;

  // ฟังก์ชันคำนวณและแสดง Badge คะแนนความเกี่ยวข้อง (Relevance Match Score Badge)
  const getScoreBadge = () => {
    if (score === undefined || score === null) return null;
    const percentage = Math.round(score * 100);

    // กำหนดโทนสีตามระดับความเกี่ยวข้อง
    let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score < 0.5) {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (score < 0.8) {
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return (
      <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClasses} shadow-sm whitespace-nowrap flex-shrink-0`}>
        <Sparkles className="w-3 h-3 flex-shrink-0" />
        <span>Match: {percentage}%</span>
      </div>
    );
  };

  return (
    <div 
      onClick={() => onOpenModal(player)}
      className="group relative bg-white rounded-2xl p-5 cursor-pointer border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div>
        {/* --- แถบแจ้งคะแนนความเกี่ยวข้อง (แสดงเฉพาะเมื่อค้นหา) --- */}
        {score !== undefined && score !== null && (
          <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>ความเกี่ยวข้อง</span>
            </span>
            {getScoreBadge()}
          </div>
        )}

        {/* --- ส่วนข้อมูลนักเตะ: รูปถ่าย, ชื่อไทย/อังกฤษ (เต็มบรรทัด ไม่โดนทับ), โลโก้สโมสร --- */}
        <div className="flex items-start space-x-3.5 mb-4">
          
          {/* รูปถ่ายนักเตะ (Avatar Photo) */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm group-hover:border-blue-300 transition-colors">
            {player.photo_url && player.photo_url !== 'N/A' && !imgError ? (
              <img
                src={player.photo_url}
                alt={player.name_en}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              /* Fallback กรณีไม่มีรูปถ่าย */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 text-gray-400">
                <Shield className="w-7 h-7 text-blue-400/60 mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">
                  {player.name_en?.slice(0, 2) || 'FB'}
                </span>
              </div>
            )}
            {/* ป้ายอายุบนรูปถ่าย */}
            {player.age > 0 && (
              <span className="absolute bottom-1 right-1 bg-white/95 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-gray-200 shadow-sm">
                {player.age} ปี
              </span>
            )}
          </div>

          {/* ชื่อนักเตะและสโมสรปัจจุบัน (แสดงชื่อเต็ม 100% ไม่ถูกตัดหรือทับซ้อน) */}
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-0.5">
              {player.name_th && player.name_th !== player.name_en ? player.name_th : player.name_en}
            </h3>
            <p className="text-xs font-semibold text-gray-500 leading-normal mb-2">
              {player.name_en}
            </p>
            
            {/* Badge สโมสรและลีก */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-medium">
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
                <span>{player.current_team}</span>
              </span>
              {player.current_league && player.current_league !== 'N/A' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-medium">
                  {player.current_league}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --- ส่วนแสดงฉายา/ชื่อย่อ (Aliases Tags) --- */}
        {aliases.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-3.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">ฉายา:</span>
            {aliases.slice(0, 3).map((alias, i) => (
              <span 
                key={i} 
                className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-medium"
              >
                {alias}
              </span>
            ))}
            {aliases.length > 3 && (
              <span className="text-[10px] text-gray-400">+{aliases.length - 3}</span>
            )}
          </div>
        )}

        {/* --- กล่องสถิติ 3 ช่อง (Stats Dashboard 3-Column Box) --- */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* ช่องประตู */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center group-hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-semibold uppercase">ประตู</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-gray-900">
              {stats.total_goals?.toLocaleString() || 0}
            </span>
          </div>

          {/* ช่องแอสซิสต์ */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center group-hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-semibold uppercase">แอสซิสต์</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-gray-900">
              {stats.total_assists?.toLocaleString() || 0}
            </span>
          </div>

          {/* ช่องถ้วยรางวัล */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center group-hover:border-gray-200 transition-colors">
            <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold uppercase">ถ้วยรางวัล</span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-amber-600">
              {stats.trophies_count || 0}
            </span>
          </div>
        </div>

        {/* --- ส่วนข้อมูลทีมชาติและรูปธงชาติ (National Team Badge) --- */}
        {national.played && national.team_name !== 'N/A' && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs mb-3">
            <div className="flex items-center space-x-2 text-gray-700 min-w-0">
              {player.flag_url && player.flag_url !== 'N/A' ? (
                <img
                  src={player.flag_url}
                  alt={national.team_name}
                  className="w-4 h-3 object-cover rounded-sm shadow-sm flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <Flag className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              )}
              <span className="font-semibold truncate">{national.team_name}</span>
            </div>
            <span className="text-gray-500 text-[11px] flex-shrink-0 ml-2">
              {national.caps} นัด / <strong className="text-blue-600 font-bold">{national.goals}</strong> ประตู
            </span>
          </div>
        )}

        {/* --- ประวัติสโมสรย่อ (Career Clubs Timeline Badges) --- */}
        {teamsHistory.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center space-x-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              <Layers className="w-3 h-3 text-gray-400" />
              <span>ประวัติสโมสร ({teamsHistory.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {teamsHistory.map((team, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200"
                >
                  {team}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- ท้ายการ์ด: ปุ่มกดดูรายละเอียด (CTA Footer) --- */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 group-hover:text-blue-600 transition-colors mt-2">
        <span className="text-[11px] font-medium">ดูรายละเอียดฉบับเต็ม</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
});
