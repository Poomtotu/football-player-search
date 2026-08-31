// ===========================================================================
// PlayerModal.jsx â€” à¸„à¸­à¸¡à¹‚à¸žà¹€à¸™à¸™à¸•à¹Œà¸«à¸™à¹‰à¸²à¸•à¹ˆà¸²à¸‡à¸›à¹Šà¸­à¸›à¸­à¸±à¸›à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸•à¹‡à¸¡à¸‚à¸­à¸‡à¸™à¸±à¸à¹€à¸•à¸° (Player Details Modal)
// ===========================================================================

import React, { useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Target, 
  Flame, 
  Flag, 
  Shield, 
  Sparkles, 

  Award,
  Share2,
  Check,
  Instagram,
  Youtube,
  ExternalLink
} from 'lucide-react';

/**
 * à¸„à¸­à¸¡à¹‚à¸žà¹€à¸™à¸™à¸•à¹Œ PlayerModal à¸ªà¸³à¸«à¸£à¸±à¸šà¹à¸ªà¸”à¸‡à¸›à¹Šà¸­à¸›à¸­à¸±à¸›à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‰à¸šà¸±à¸šà¹€à¸•à¹‡à¸¡à¸‚à¸­à¸‡à¸™à¸±à¸à¹€à¸•à¸°à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸
 * à¸›à¸£à¸°à¸à¸­à¸šà¸”à¹‰à¸§à¸¢: à¸£à¸¹à¸›à¹ƒà¸«à¸à¹ˆ, à¸Šà¸·à¹ˆà¸­à¹„à¸—à¸¢/à¸­à¸±à¸‡à¸à¸¤à¸©, à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™, à¸ªà¸–à¸´à¸•à¸´ 4 à¸Šà¹ˆà¸­à¸‡, à¸—à¸µà¸¡à¸Šà¸²à¸•à¸´ à¹à¸¥à¸°à¸›à¸¸à¹ˆà¸¡à¸„à¸±à¸”à¸¥à¸­à¸à¸¥à¸´à¸‡à¸à¹Œà¹à¸Šà¸£à¹Œ
 * 
 * @param {object} player - à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¹€à¸•à¸°à¸£à¸²à¸¢à¸šà¸¸à¸„à¸„à¸¥à¸—à¸µà¹ˆà¸–à¸¹à¸à¹€à¸¥à¸·à¸­à¸
 * @param {function} onClose - à¸Ÿà¸±à¸‡à¸à¹Œà¸Šà¸±à¸™à¹€à¸¡à¸·à¹ˆà¸­à¸„à¸¥à¸´à¸à¸›à¸´à¸”à¸›à¹Šà¸­à¸›à¸­à¸±à¸› (à¸«à¸£à¸·à¸­à¸à¸”à¸›à¸¸à¹ˆà¸¡ Escape)
 */
export function PlayerModal({ player, onClose }) {
  // State à¸›à¹‰à¸²à¸¢à¸ªà¸–à¸²à¸™à¸°à¹€à¸¡à¸·à¹ˆà¸­à¸à¸”à¸„à¸±à¸”à¸¥à¸­à¸à¸¥à¸´à¸‡à¸à¹Œà¹à¸Šà¸£à¹Œà¸ªà¸³à¹€à¸£à¹‡à¸ˆ (Copied State)
  const [copied, setCopied] = React.useState(false);
  const [detailPlayer, setDetailPlayer] = React.useState(null);

  // à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸•à¹‡à¸¡à¸ˆà¸²à¸ /api/players/{id} à¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡à¹€à¸¡à¸·à¹ˆà¸­à¹€à¸›à¸´à¸” Modal
  // à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸«à¹‰ bio à¹à¸¥à¸° social_links à¹„à¸¡à¹ˆà¸«à¸²à¸¢ à¹à¸¡à¹‰à¸œà¸¥à¸„à¹‰à¸™à¸«à¸²à¸ˆà¸°à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¡à¸²à¹„à¸¡à¹ˆà¸„à¸£à¸š
  useEffect(() => {
    let cancelled = false;

    const loadPlayerDetail = async () => {
      if (!player?.id) {
        setDetailPlayer(null);
        return;
      }

      try {
        const res = await fetch(`/api/players/${player.id}`);
        if (!res.ok) throw new Error(`Player detail request failed (${res.status})`);
        const data = await res.json();
        if (!cancelled) setDetailPlayer(data);
      } catch (err) {
        console.warn('Player detail API error:', err);
        if (!cancelled) setDetailPlayer(null);
      }
    };

    loadPlayerDetail();
    return () => { cancelled = true; };
  }, [player?.id]);

  // à¸”à¸±à¸à¸ˆà¸±à¸šà¹€à¸«à¸•à¸¸à¸à¸²à¸£à¸“à¹Œà¸à¸”à¸›à¸¸à¹ˆà¸¡ Escape à¸šà¸™à¸„à¸µà¸¢à¹Œà¸šà¸­à¸£à¹Œà¸”à¹€à¸žà¸·à¹ˆà¸­à¸›à¸´à¸” Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // à¸¥à¹‡à¸­à¸à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰à¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸‡ scroll à¹„à¸”à¹‰à¸‚à¸“à¸°à¹€à¸›à¸´à¸” Modal
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!player) return null;

  // à¹ƒà¸Šà¹‰à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸•à¹‡à¸¡à¹€à¸¡à¸·à¹ˆà¸­ API à¸ªà¹ˆà¸‡à¸à¸¥à¸±à¸šà¸¡à¸²à¹à¸¥à¹‰à¸§
  const displayPlayer = detailPlayer || player;

  // à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¢à¹ˆà¸­à¸¢à¸žà¸£à¹‰à¸­à¸¡à¸„à¹ˆà¸² default à¸›à¹‰à¸­à¸‡à¸à¸±à¸™ crash
  const stats = displayPlayer.stats || { total_goals: 0, total_assists: 0, trophies_count: 0 };
  const national = displayPlayer.national_team || { played: false, team_name: 'N/A', caps: 0, goals: 0 };

  const aliases = displayPlayer.aliases || [];
  const bio = displayPlayer.bio || '';
  const careerTerms = Array.isArray(displayPlayer.teams_history) ? displayPlayer.teams_history : [];
  const socialLinks = displayPlayer.social_links || {};
  const score = displayPlayer.relevance_score;
  const formatDate = (v) => { if (!v) return "à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥"; const d=new Date(v); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"long",year:"numeric"}).format(d); };
  const personalFields = [["à¸Šà¸·à¹ˆà¸­à¹€à¸¥à¹ˆà¸™",displayPlayer.nickname],["à¸§à¸±à¸™à¹€à¸”à¸·à¸­à¸™à¸›à¸µà¹€à¸à¸´à¸”",displayPlayer.birth_date ? `${formatDate(displayPlayer.birth_date)}${displayPlayer.age ? ` Â· à¸­à¸²à¸¢à¸¸ ${displayPlayer.age} à¸›à¸µ` : ""}` : (displayPlayer.age ? `à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸à¸§à¸±à¸™à¹€à¸à¸´à¸” Â· à¸­à¸²à¸¢à¸¸ ${displayPlayer.age} à¸›à¸µ` : null)],["à¸ªà¹ˆà¸§à¸™à¸ªà¸¹à¸‡",displayPlayer.height_cm ? `${displayPlayer.height_cm} à¸‹à¸¡.` : null],["à¸™à¹‰à¸³à¸«à¸™à¸±à¸",displayPlayer.weight_kg ? `${displayPlayer.weight_kg} à¸à¸.` : null],["à¸ªà¸±à¸à¸Šà¸²à¸•à¸´",national.played && national.team_name !== "N/A" ? national.team_name : null],["à¸ªà¸–à¸²à¸™à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆà¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™",displayPlayer.residence]];
  const footballFields = [["à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡à¸«à¸¥à¸±à¸",displayPlayer.primary_position],["à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡à¸£à¸­à¸‡",Array.isArray(displayPlayer.secondary_positions)&&displayPlayer.secondary_positions.length ? displayPlayer.secondary_positions.join(" Â· ") : null],["à¹€à¸—à¹‰à¸²à¸—à¸µà¹ˆà¸–à¸™à¸±à¸”",displayPlayer.preferred_foot],["à¹€à¸šà¸­à¸£à¹Œà¹€à¸ªà¸·à¹‰à¸­",displayPlayer.shirt_number ? `#${displayPlayer.shirt_number}` : null]];
  const contactEntries=Object.entries(displayPlayer.contact||{}).filter(([,v])=>v); const strengths=Array.isArray(displayPlayer.strengths)?displayPlayer.strengths.filter(Boolean):[]; const profileSummary=displayPlayer.profile_summary||"";

  // à¸„à¸³à¸™à¸§à¸“à¸ˆà¸³à¸™à¸§à¸™à¸›à¸£à¸°à¸•à¸¹ + à¹à¸­à¸ªà¸‹à¸´à¸ªà¸•à¹Œà¸£à¸§à¸¡ (Goal Contributions)
  const totalContributions = (stats.total_goals || 0) + (stats.total_assists || 0);

  // à¸Ÿà¸±à¸‡à¸à¹Œà¸Šà¸±à¸™à¸„à¸±à¸”à¸¥à¸­à¸à¸¥à¸´à¸‡à¸à¹Œà¹à¸Šà¸£à¹Œà¹„à¸›à¸¢à¸±à¸‡ Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?q=${encodeURIComponent(displayPlayer.name_en)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[3px] transition-opacity"
      ></div>

      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-[28px] shadow-2xl overflow-hidden z-10 animate-slide-up my-3 sm:my-6 max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)] overflow-y-auto">
        <div className="relative h-28 sm:h-36 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 px-5 sm:px-7 pt-5">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_45%)]"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              {score !== undefined && score !== null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/95 text-blue-700 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>IR Relevance Score: {(score * 100).toFixed(1)}%</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all" title="à¸„à¸±à¸”à¸¥à¸­à¸à¸¥à¸´à¸‡à¸à¹Œà¸™à¸±à¸à¹€à¸•à¸°">
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all" title="à¸›à¸´à¸”à¸«à¸™à¹‰à¸²à¸•à¹ˆà¸²à¸‡ (Esc)">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative px-5 sm:px-7 pb-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-16 mb-5 gap-4 sm:gap-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex-shrink-0 relative">
              {displayPlayer.photo_url && displayPlayer.photo_url !== 'N/A' ? (
                <img src={displayPlayer.photo_url} alt={displayPlayer.name_en} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                  <Shield className="w-10 h-10 text-blue-400/60 mb-1" />
                  <span className="text-xs font-bold uppercase">{displayPlayer.name_en?.slice(0, 2)}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-0.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                {displayPlayer.name_th && displayPlayer.name_th !== displayPlayer.name_en ? displayPlayer.name_th : displayPlayer.name_en}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-1 mb-2.5">
                {displayPlayer.name_en} {displayPlayer.age > 0 && <span className="text-slate-400 font-normal">â€¢ à¸­à¸²à¸¢à¸¸ {displayPlayer.age} à¸›à¸µ</span>}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  {displayPlayer.club_logo_url && displayPlayer.club_logo_url !== 'N/A' ? <img src={displayPlayer.club_logo_url} alt={displayPlayer.current_team} className="w-4 h-4 object-contain" onError={(e) => { e.target.style.display = 'none'; }} /> : <span>âš½</span>}
                  <span>{displayPlayer.current_team}</span>
                </span>
                {displayPlayer.current_league && displayPlayer.current_league !== 'N/A' && <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">ðŸ† {displayPlayer.current_league}</span>}
              </div>
            </div>
          </div>

          {aliases.length > 0 && (
            <div className="mb-5 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>à¸‰à¸²à¸¢à¸²à¹à¸¥à¸°à¸Šà¸·à¹ˆà¸­à¹€à¸£à¸µà¸¢à¸à¸­à¸·à¹ˆà¸™à¹† ({aliases.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {aliases.map((alias, idx) => <span key={idx} className="px-3 py-1 rounded-lg bg-white text-blue-700 border border-blue-200 text-xs font-medium shadow-sm">{alias}</span>)}
              </div>
            </div>
          )}

          <section className="mb-5 bg-blue-50/70 border border-blue-100 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 font-black">i</div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">à¸›à¸£à¸°à¸§à¸±à¸•à¸´à¸™à¸±à¸à¹€à¸•à¸°</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">à¸ªà¸£à¸¸à¸›à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¸³à¸„à¸±à¸à¸‚à¸­à¸‡à¸™à¸±à¸à¹€à¸•à¸°à¹à¸šà¸šà¸à¸£à¸°à¸Šà¸±à¸š</p>
              </div>
            </div>
            <div className="space-y-3">
              {(profileSummary || strengths.length > 0) && (
                <div className="pt-3 border-t border-blue-100">
                  {profileSummary && <p className="text-sm leading-6 text-slate-700">{profileSummary}</p>}
                  {strengths.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {strengths.map((item, i) => (
                        <span key={`${item}-${i}`} className="px-2.5 py-1 rounded-lg bg-white border border-blue-100 text-xs font-semibold text-slate-700">{item}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {Object.keys(socialLinks).length > 0 && (
            <section className="mb-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸•à¸´à¸”à¸•à¸²à¸¡à¸™à¸±à¸à¹€à¸•à¸°</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socialLinks).map(([platform, url]) => url ? (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all text-xs font-bold shadow-sm">
                    {platform === 'instagram' ? <Instagram className="w-4 h-4" /> : platform === 'youtube' ? <Youtube className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    <span className="capitalize">{platform === 'x' ? 'X' : platform.replace(/_/g, ' ')}</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ) : null)}
              </div>
            </section>
          )}

          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              à¸ªà¸–à¸´à¸•à¸´à¸à¸²à¸£à¹€à¸¥à¹ˆà¸™à¸•à¸¥à¸­à¸”à¸­à¸²à¸Šà¸µà¸ž
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. à¸›à¸£à¸°à¸•à¸¹à¸£à¸§à¸¡ */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>à¸›à¸£à¸°à¸•à¸¹à¸£à¸§à¸¡</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {stats.total_goals?.toLocaleString() || 0}
                </div>
                <span className="text-[10px] text-gray-400">à¸•à¸¥à¸­à¸”à¸­à¸²à¸Šà¸µà¸ž</span>
              </div>

              {/* 2. à¹à¸­à¸ªà¸‹à¸´à¸ªà¸•à¹Œà¸£à¸§à¸¡ */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>à¹à¸­à¸ªà¸‹à¸´à¸ªà¸•à¹Œà¸£à¸§à¸¡</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-900">
                  {stats.total_assists?.toLocaleString() || 0}
                </div>
                <span className="text-[10px] text-gray-400">à¸•à¸¥à¸­à¸”à¸­à¸²à¸Šà¸µà¸ž</span>
              </div>

              {/* 3. à¸–à¹‰à¸§à¸¢à¸£à¸²à¸‡à¸§à¸±à¸¥ */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>à¸–à¹‰à¸§à¸¢à¸£à¸²à¸‡à¸§à¸±à¸¥</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-600">
                  {stats.trophies_count || 0}
                </div>
                <span className="text-[10px] text-gray-400">à¹à¸Šà¸¡à¸›à¹Œà¸£à¸§à¸¡</span>
              </div>

              {/* 4. à¸à¸²à¸£à¸¡à¸µà¸ªà¹ˆà¸§à¸™à¸£à¹ˆà¸§à¸¡à¸›à¸£à¸°à¸•à¸¹à¸£à¸§à¸¡ (Goals + Assists) */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                <div className="text-xs font-medium text-gray-500 flex items-center justify-center space-x-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>à¸¡à¸µà¸ªà¹ˆà¸§à¸™à¸£à¹ˆà¸§à¸¡à¸›à¸£à¸°à¸•à¸¹</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-indigo-600">
                  {totalContributions.toLocaleString()}
                </div>
                <span className="text-[10px] text-gray-400">Goals + Assists</span>
              </div>
            </div>
          </div>

          {/* --- à¸ªà¹ˆà¸§à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¸¡à¸Šà¸²à¸•à¸´à¹à¸¥à¸°à¸£à¸¹à¸›à¸˜à¸‡à¸Šà¸²à¸•à¸´ (National Team Section) --- */}
          {national.played && national.team_name !== 'N/A' && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* à¸£à¸¹à¸›à¸˜à¸‡à¸Šà¸²à¸•à¸´ */}
                <div className="w-12 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {displayPlayer.flag_url && displayPlayer.flag_url !== 'N/A' ? (
                    <img
                      src={displayPlayer.flag_url}
                      alt={national.team_name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Flag className={`w-5 h-5 text-blue-600 ${displayPlayer.flag_url && displayPlayer.flag_url !== 'N/A' ? 'hidden' : ''}`} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 block">à¸—à¸µà¸¡à¸Šà¸²à¸•à¸´</span>
                  <span className="text-base font-bold text-gray-900">{national.team_name}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-gray-900">{national.caps} à¸™à¸±à¸”</span>
                <span className="text-xs text-blue-600 font-bold block">{national.goals} à¸›à¸£à¸°à¸•à¸¹</span>
              </div>
            </div>
          )}

          {/* --- à¹€à¸ªà¹‰à¸™à¸—à¸²à¸‡à¸­à¸²à¸Šà¸µà¸žà¹à¸¥à¸°à¸ªà¹‚à¸¡à¸ªà¸£à¸—à¸µà¹ˆà¹€à¸„à¸¢à¸„à¹‰à¸²à¹à¸‚à¹‰à¸‡ --- */}
          {careerTerms.length > 0 && (
            <section className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="text-blue-600">âš½</span>
                <span>à¹€à¸ªà¹‰à¸™à¸—à¸²à¸‡à¸­à¸²à¸Šà¸µà¸žà¹à¸¥à¸°à¸ªà¹‚à¸¡à¸ªà¸£à¸—à¸µà¹ˆà¹€à¸„à¸¢à¸„à¹‰à¸²à¹à¸‚à¹‰à¸‡</span>
              </div>
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {careerTerms.map((team, idx) => {
                  const isCurrent = idx === careerTerms.length - 1;
                  return (
                    <div key={`${team}-${idx}`} className="relative flex items-center justify-between gap-3 text-xs">
                      <span className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isCurrent ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-300'}`} />
                      <span className={`font-semibold ${isCurrent ? 'text-blue-600 text-sm font-bold' : 'text-gray-700'}`}>{team}</span>
                      {isCurrent && <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* --- à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡à¸‚à¸­à¸‡à¸™à¸±à¸à¹€à¸•à¸° --- */}
          <section className="mb-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black">i</div><div><h4 className="text-sm font-extrabold text-slate-900">à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡</h4><p className="text-[11px] text-slate-400 mt-0.5">à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§à¹à¸¥à¸°à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸Ÿà¸¸à¸•à¸šà¸­à¸¥à¸—à¸µà¹ˆà¸¡à¸µà¸à¸²à¸£à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸§à¹‰</p></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div><h5 className="text-xs font-bold text-slate-500 mb-3">à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™</h5><div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden"><div className="px-3.5 py-3 bg-slate-50/70"><span className="text-[11px] text-slate-400 block">à¸Šà¸·à¹ˆà¸­-à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥</span><span className="text-sm font-bold text-slate-900">{displayPlayer.name_en}</span></div>{personalFields.map(([label,value])=><div key={label} className="px-3.5 py-3"><span className="text-[11px] text-slate-400 block">{label}</span><span className={`text-sm font-semibold ${value?'text-slate-800':'text-slate-400'}`}>{value||'à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥'}</span></div>)}</div></div>
              <div><h5 className="text-xs font-bold text-slate-500 mb-3">à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸”à¹‰à¸²à¸™à¸Ÿà¸¸à¸•à¸šà¸­à¸¥</h5><div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">{footballFields.map(([label,value])=><div key={label} className="px-3.5 py-3"><span className="text-[11px] text-slate-400 block">{label}</span><span className={`text-sm font-semibold ${value?'text-slate-800':'text-slate-400'}`}>{value||'à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥'}</span></div>)}<div className="px-3.5 py-3 bg-slate-50/70"><span className="text-[11px] text-slate-400 block">à¸ªà¹‚à¸¡à¸ªà¸£à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™</span><span className="text-sm font-bold text-slate-900">{displayPlayer.current_team||'à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥'}</span></div><div className="px-3.5 py-3"><span className="text-[11px] text-slate-400 block">à¸¥à¸µà¸à¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™</span><span className="text-sm font-semibold text-slate-800">{displayPlayer.current_league||'à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥'}</span></div></div></div>
            </div>
            {contactEntries.length>0&&<div className="mt-5"><h5 className="text-xs font-bold text-slate-500 mb-3">à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸²à¸˜à¸²à¸£à¸“à¸°</h5><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{contactEntries.map(([label,value])=><div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3"><span className="text-[11px] text-slate-400 block">{label}</span><span className="text-sm font-semibold text-slate-800 break-all">{value}</span></div>)}</div></div>}
            {(profileSummary||strengths.length>0)&&<div className="mt-5 rounded-xl bg-blue-50/70 border border-blue-100 p-4"><h5 className="text-xs font-bold text-blue-700 mb-2">à¸ªà¹„à¸•à¸¥à¹Œà¸à¸²à¸£à¹€à¸¥à¹ˆà¸™à¹à¸¥à¸°à¸ˆà¸¸à¸”à¹€à¸”à¹ˆà¸™</h5>{profileSummary&&<p className="text-sm leading-6 text-slate-700">{profileSummary}</p>}{strengths.length>0&&<div className="flex flex-wrap gap-2 mt-3">{strengths.map((item,i)=><span key={`${item}-${i}`} className="px-2.5 py-1 rounded-lg bg-white border border-blue-100 text-xs font-semibold text-slate-700">{item}</span>)}</div>}</div>}
          </section>
        </div>
      </div>
    </div>
  );
}
