import React, { useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import {
  Activity,
  Award,
  Building2,
  CalendarDays,
  Check,
  CircleUserRound,
  ExternalLink,
  FileText,
  Flag,
  Footprints,
  Instagram,
  Link2,
  Ruler,
  Scale,
  Share2,
  Shield,
  Shirt,
  Target,
  Trophy,
  X,
  Youtube,
} from 'lucide-react';

export function PlayerModal({ player, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const [detailPlayer, setDetailPlayer] = React.useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadPlayerDetail = async () => {
      if (!player?.id) {
        setDetailPlayer(null);
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.playerById(player.id));
        if (!response.ok) throw new Error(`Player detail request failed (${response.status})`);
        const data = await response.json();
        if (!cancelled) setDetailPlayer(data);
      } catch (error) {
        console.warn('Player detail API error:', error);
        if (!cancelled) setDetailPlayer(null);
      }
    };

    loadPlayerDetail();
    return () => { cancelled = true; };
  }, [player?.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!player) return null;

  const displayPlayer = detailPlayer || player;
  const stats = displayPlayer.stats || {};
  const national = displayPlayer.national_team || {};
  const aliases = Array.isArray(displayPlayer.aliases) ? displayPlayer.aliases : [];
  const strengths = Array.isArray(displayPlayer.strengths) ? displayPlayer.strengths.filter(Boolean) : [];
  const careerTerms = Array.isArray(displayPlayer.teams_history) ? displayPlayer.teams_history.filter(Boolean) : [];
  const socialLinks = displayPlayer.social_links || {};
  const bio = displayPlayer.bio || '';
  const profileSummary = displayPlayer.profile_summary || '';
  const totalContributions = (stats.total_goals || 0) + (stats.total_assists || 0);

  const formatDate = (value) => {
    if (!value) return 'ไม่มีข้อมูล';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  };

  const personalFields = [
    ['วันเกิด', displayPlayer.birth_date ? formatDate(displayPlayer.birth_date) : null],
    ['อายุ', displayPlayer.age ? `${displayPlayer.age} ปี` : null],
    ['ส่วนสูง', displayPlayer.height_cm ? `${displayPlayer.height_cm} ซม.` : null],
    ['น้ำหนัก', displayPlayer.weight_kg ? `${displayPlayer.weight_kg} กก.` : null],
  ];

  const footballFields = [
    ['ตำแหน่ง', displayPlayer.primary_position],
    ['ตำแหน่งรอง', Array.isArray(displayPlayer.secondary_positions) && displayPlayer.secondary_positions.length
      ? displayPlayer.secondary_positions.join(' / ')
      : null],
    ['เท้าที่ถนัด', displayPlayer.preferred_foot],
    ['เบอร์เสื้อ', displayPlayer.shirt_number ? `#${displayPlayer.shirt_number}` : null],
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/?q=${encodeURIComponent(displayPlayer.name_en)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const statItems = [
    {
      label: 'Goals',
      value: stats.total_goals ?? 0,
      detail: 'ประตูรวม',
      icon: Target,
    },
    {
      label: 'Assists',
      value: stats.total_assists ?? 0,
      detail: 'แอสซิสต์รวม',
      icon: Award,
    },
    {
      label: 'Trophies',
      value: stats.trophies_count ?? 0,
      detail: 'แชมป์รวม',
      icon: Trophy,
    },
    {
      label: 'G+A',
      value: totalContributions,
      detail: 'มีส่วนร่วมประตู',
      icon: Shield,
    },
  ];

  const heroPhotoUrl = displayPlayer.hero_photo_url || displayPlayer.photo_url;
  const heroUsesCutout = Boolean(heroPhotoUrl?.includes('/cutout/'));
  const portraitPositionMap = {
    'Lionel Messi': 'center 16%',
    'Cristiano Ronaldo': 'center 18%',
    'Erling Haaland': 'center 14%',
    'Kylian Mbappé': 'center 14%',
    'Neymar': 'center 15%',
    'Mohamed Salah': 'center 14%',
  };
  const heroCutoutTuningMap = {
    'Kylian Mbappé': {
      width: '55%',
      height: '96%',
      right: '-1%',
      objectPosition: 'center bottom',
      scale: 1,
      translateY: '4%',
      fit: 'contain',
    },
    'Neymar': {
      width: '54%',
      height: '95%',
      right: '0%',
      objectPosition: 'center bottom',
      scale: 1,
      translateY: '3%',
      fit: 'contain',
    },
    'Erling Haaland': {
      width: '55%',
      height: '98%',
      right: '-1%',
      objectPosition: 'center bottom',
      scale: 1.01,
      translateY: '2%',
      fit: 'contain',
    },
    'Cristiano Ronaldo': {
      width: '55%',
      height: '98%',
      right: '-1%',
      objectPosition: 'center bottom',
      scale: 1.01,
      translateY: '2%',
      fit: 'contain',
    },
    'Lionel Messi': {
      width: '55%',
      height: '98%',
      right: '-1%',
      objectPosition: 'center bottom',
      scale: 1.01,
      translateY: '2%',
      fit: 'contain',
    },
  };
  const heroImageTuning = heroUsesCutout
    ? (heroCutoutTuningMap[displayPlayer.name_en] || {
        width: '55%',
        height: '97%',
        right: '-1%',
        objectPosition: 'center bottom',
        scale: 1,
        translateY: '2.5%',
        fit: 'contain',
      })
    : {
        width: '57%',
        height: '100%',
        right: '0%',
        objectPosition: portraitPositionMap[displayPlayer.name_en] || 'center 18%',
        scale: 1,
        translateY: '0%',
        fit: 'cover',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-4">
      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        onClick={onClose}
        className="modal-backdrop fixed inset-0 bg-[#020817]/80 backdrop-blur-[4px]"
      />

      <article className="player-profile-modal profile-shell modal-panel relative z-10 my-2 w-full max-w-[1380px] overflow-hidden rounded-[14px] border border-white/10 bg-[#f4f6f8] shadow-[0_36px_110px_-35px_rgba(0,0,0,.8)] sm:my-4">
        <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="profile-floating-action flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-white shadow-lg backdrop-blur-md transition hover:bg-slate-950/70"
            title="คัดลอกลิงก์นักเตะ"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Share2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="profile-floating-action flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-white shadow-lg backdrop-blur-md transition hover:bg-slate-950/70"
            title="ปิด (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <main className="min-w-0 space-y-5">
            <section className="profile-hero-card relative min-h-[330px] overflow-hidden rounded-[12px] bg-[#061225] shadow-[0_24px_70px_-38px_rgba(15,23,42,.8)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(59,130,246,.38),transparent_34%),linear-gradient(115deg,#061225_0%,#08254f_58%,#0b3268_100%)]" />
              <div className="player-profile-grid absolute inset-0 opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#061225] via-[#061225]/85 to-transparent" />

              {heroPhotoUrl && heroPhotoUrl !== 'N/A' && (
                <img
                  src={heroPhotoUrl}
                  alt={displayPlayer.name_en}
                  referrerPolicy="no-referrer"
                  className="absolute bottom-0 object-cover opacity-95 [mask-image:linear-gradient(to_left,#000_74%,transparent_100%)]"
                  style={{
                    width: heroImageTuning.width,
                    height: heroImageTuning.height,
                    right: heroImageTuning.right,
                    objectPosition: heroImageTuning.objectPosition,
                    objectFit: heroImageTuning.fit || 'cover',
                    transform: `translateY(${heroImageTuning.translateY || '0%'}) scale(${heroImageTuning.scale})`,
                    transformOrigin: 'bottom right',
                  }}
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                />
              )}

              <div className="relative z-10 flex min-h-[330px] max-w-[58%] flex-col p-6 sm:p-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                    {displayPlayer.current_league || 'Football Player'}
                  </p>
                  <h1 className="mt-3 text-4xl font-black leading-[.95] tracking-[-0.045em] text-white sm:text-5xl">
                    {displayPlayer.name_en}
                  </h1>
                  {displayPlayer.name_th && displayPlayer.name_th !== displayPlayer.name_en && (
                    <p className="mt-3 text-sm font-semibold text-slate-300">{displayPlayer.name_th}</p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-200">
                    {national.played && national.team_name && national.team_name !== 'N/A' && (
                      <div className="flex items-center gap-2">
                        {displayPlayer.flag_url && displayPlayer.flag_url !== 'N/A' ? (
                          <img
                            src={displayPlayer.flag_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-5 w-8 rounded object-cover"
                          />
                        ) : (
                          <Flag className="h-4 w-4 text-blue-300" />
                        )}
                        <span className="font-bold">{national.team_name}</span>
                      </div>
                    )}
                    {displayPlayer.primary_position && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                        {displayPlayer.primary_position}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-7 sm:grid-cols-4">
                  {statItems.map(({ label, value, detail, icon: Icon }) => (
                    <div key={label} className="rounded-md border border-white/10 bg-black/20 px-3 py-2.5 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        <Icon className="h-3.5 w-3.5 text-blue-300" />
                        {label}
                      </div>
                      <div className="mt-1 text-xl font-black text-white">{Number(value).toLocaleString()}</div>
                      <div className="mt-0.5 text-[9px] text-slate-400">{detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {aliases.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-2">
                <span className="text-xs font-bold text-slate-400">ชื่ออื่น</span>
                {aliases.map((alias, index) => (
                  <span key={`${alias}-${index}`} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {alias}
                  </span>
                ))}
              </div>
            )}

            {(profileSummary || strengths.length > 0) && (
              <section className="profile-content-card rounded-[10px] bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Target className="h-5 w-5" />
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">สไตล์การเล่นและจุดเด่น</h2>
                </div>
                {profileSummary && (
                  <p className="mt-4 text-[15px] leading-7 text-slate-600">{profileSummary}</p>
                )}
                {strengths.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {strengths.map((item, index) => (
                      <span key={`${item}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="profile-content-card rounded-[10px] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-black tracking-tight text-slate-950">ประวัตินักเตะ</h2>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-slate-600">
                {bio.split('เส้นทางสโมสร:')[0].trim() ||
                  `${displayPlayer.name_en} เป็นนักฟุตบอลอาชีพที่มีข้อมูลอยู่ในฐานข้อมูล Football.IR`}
              </p>
            </section>

            {national.played && national.team_name && national.team_name !== 'N/A' && (
              <section className="profile-content-card rounded-[10px] bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Flag className="h-5 w-5" />
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">ทีมชาติ</h2>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                      {displayPlayer.flag_url && displayPlayer.flag_url !== 'N/A' ? (
                        <img src={displayPlayer.flag_url} alt={national.team_name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <Flag className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-950">{national.team_name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">ทีมชาติชุดใหญ่</p>
                    </div>
                  </div>
                  <div className="flex gap-7 text-right">
                    <div>
                      <div className="text-2xl font-black text-slate-950">{national.caps ?? 0}</div>
                      <div className="text-xs font-semibold text-slate-400">นัด</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-950">{national.goals ?? 0}</div>
                      <div className="text-xs font-semibold text-slate-400">ประตู</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {careerTerms.length > 0 && (
              <section className="profile-content-card rounded-[10px] bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Trophy className="h-5 w-5" />
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">เส้นทางสโมสร</h2>
                </div>

                <div className="mt-5">
                  {careerTerms.map((team, index) => {
                    const isCurrent = team === displayPlayer.current_team || index === careerTerms.length - 1;
                    return (
                      <div key={`${team}-${index}`} className="relative flex min-h-12 items-center gap-4 pl-7">
                        {index < careerTerms.length - 1 && (
                          <span className="absolute bottom-0 left-[6px] top-6 w-px bg-slate-200" />
                        )}
                        <span className={`absolute left-0 flex h-3.5 w-3.5 rounded-full border-2 border-white ring-1 ${isCurrent ? 'bg-blue-600 ring-blue-200' : 'bg-slate-300 ring-slate-200'}`} />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-b border-slate-100 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                              <Shield className="h-4 w-4" />
                            </span>
                            <span className={`truncate text-sm font-bold ${isCurrent ? 'text-slate-950' : 'text-slate-600'}`}>{team}</span>
                          </div>
                          {isCurrent && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">ปัจจุบัน</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-5">
            <section className="rounded-[10px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-32px_rgba(15,23,42,.45)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <CircleUserRound className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-black tracking-tight text-slate-950">ข้อมูลนักเตะ</h2>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-black text-slate-800">ข้อมูลส่วนตัว</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['วันเกิด', displayPlayer.birth_date ? formatDate(displayPlayer.birth_date) : null, CalendarDays],
                    ['อายุ', displayPlayer.age ? `${displayPlayer.age} ปี` : null, CircleUserRound],
                    ['ส่วนสูง', displayPlayer.height_cm ? `${displayPlayer.height_cm} ซม.` : null, Ruler],
                    ['น้ำหนัก', displayPlayer.weight_kg ? `${displayPlayer.weight_kg} กก.` : null, Scale],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="profile-info-tile min-h-[96px] rounded-md border border-slate-200 bg-slate-50 p-3.5">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <p className="mt-2 text-[11px] font-semibold text-slate-400">{label}</p>
                      <strong className="mt-1 block text-[15px] font-black leading-5 text-slate-950">{value || '—'}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="mb-3 text-sm font-black text-slate-800">ข้อมูลฟุตบอล</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['ตำแหน่ง', displayPlayer.primary_position, Target],
                    ['ตำแหน่งรอง', Array.isArray(displayPlayer.secondary_positions) && displayPlayer.secondary_positions.length ? displayPlayer.secondary_positions.join(' / ') : null, Activity],
                    ['เท้าที่ถนัด', displayPlayer.preferred_foot, Footprints],
                    ['เบอร์เสื้อ', displayPlayer.shirt_number ? `#${displayPlayer.shirt_number}` : null, Shirt],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="profile-info-tile min-h-[96px] rounded-md border border-slate-200 bg-slate-50 p-3.5">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <p className="mt-2 text-[11px] font-semibold text-slate-400">{label}</p>
                      <strong className="mt-1 block text-[15px] font-black leading-5 text-slate-950">{value || '—'}</strong>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-3">
                  <div className="profile-info-wide flex min-h-[72px] items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm">
                      {displayPlayer.club_logo_url && displayPlayer.club_logo_url !== 'N/A' ? (
                        <img src={displayPlayer.club_logo_url} alt="" referrerPolicy="no-referrer" className="h-7 w-7 object-contain" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-400">สโมสร</p>
                      <strong className="mt-0.5 block truncate text-[15px] font-black text-slate-950">{displayPlayer.current_team || '—'}</strong>
                    </div>
                  </div>

                  <div className="profile-info-wide flex min-h-[72px] items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-400">ลีก</p>
                      <strong className="mt-0.5 block truncate text-[15px] font-black text-slate-950">{displayPlayer.current_league || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {Object.keys(socialLinks).length > 0 && (
              <section className="rounded-[10px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_-32px_rgba(15,23,42,.45)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Link2 className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-black tracking-tight text-slate-950">ติดตามนักเตะ</h2>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {Object.entries(socialLinks).map(([platform, url]) => {
                    if (!url) return null;
                    const Icon = platform === 'instagram'
                      ? Instagram
                      : platform === 'youtube'
                        ? Youtube
                        : ExternalLink;

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-social-tile group flex min-h-[54px] items-center justify-between rounded-md border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon className="h-4 w-4 flex-shrink-0 text-blue-600" />
                          <span className="truncate capitalize">{platform === 'x' ? 'X' : platform.replace(/_/g, ' ')}</span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition group-hover:text-blue-500" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}
