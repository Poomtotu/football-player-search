import React from 'react';
import {
  ArrowRight,
  Crown,
  Search,
  X,
} from 'lucide-react';

export function HeroSearch({
  query,
  setQuery,
  loading,
  onSelectChip,
  featuredPlayer,
  players = [],
  onOpenModal,
  totalPlayers,
  compact = false,
}) {
  const quickTags = ['เมสซี่', 'โรนัลโด้', 'ฮาแลนด์', 'เอ็มบัปเป้', 'ซาลาห์', 'บังโม'];
  const stats = featuredPlayer?.stats || {};
  const spotlightPhotoUrl = featuredPlayer?.hero_photo_url || featuredPlayer?.photo_url;
  const spotlightUsesCutout = Boolean(spotlightPhotoUrl?.includes('/cutout/'));
  const spotlightPortraitPositionMap = {
    'Lionel Messi': 'center 16%',
    'Cristiano Ronaldo': 'center 18%',
    'Erling Haaland': 'center 14%',
    'Kylian Mbappé': 'center 14%',
    'Neymar': 'center 15%',
    'Mohamed Salah': 'center 14%',
  };
  const spotlightCutoutTuningMap = {
    'Erling Haaland': {
      width: '74%',
      height: '122%',
      right: '-7%',
      objectPosition: 'center bottom',
      scale: 1.12,
      fit: 'contain',
    },
    'Cristiano Ronaldo': {
      width: '68%',
      height: '114%',
      right: '-7%',
      objectPosition: 'center bottom',
      scale: 1.1,
      fit: 'contain',
    },
    'Lionel Messi': {
      width: '66%',
      height: '112%',
      right: '-6%',
      objectPosition: 'center bottom',
      scale: 1.08,
      fit: 'contain',
    },
    'Kylian Mbappé': {
      width: '67%',
      height: '113%',
      right: '-6%',
      objectPosition: 'center bottom',
      scale: 1.09,
      fit: 'contain',
    },
    'Neymar': {
      width: '66%',
      height: '111%',
      right: '-6%',
      objectPosition: 'center bottom',
      scale: 1.07,
      fit: 'contain',
    },
    'Mohamed Salah': {
      width: '67%',
      height: '113%',
      right: '-6%',
      objectPosition: 'center bottom',
      scale: 1.09,
      fit: 'contain',
    },
  };
  const spotlightImageTuning = spotlightUsesCutout
    ? (spotlightCutoutTuningMap[featuredPlayer?.name_en] || {
        width: '66%',
        height: '112%',
        right: '-6%',
        objectPosition: 'center bottom',
        scale: 1.08,
        fit: 'contain',
      })
    : {
        width: '58%',
        height: '100%',
        right: '-1%',
        objectPosition: spotlightPortraitPositionMap[featuredPlayer?.name_en] || 'center 18%',
        scale: 1,
        fit: 'cover',
      };

  if (compact) {
    return (
      <section className="search-mode-hero border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="grid items-center gap-5 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">
                Player Search
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                ค้นหานักฟุตบอล
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{totalPlayers || 100} โปรไฟล์</span>
                <span className="h-3 w-px bg-slate-600" aria-hidden="true" />
                <span>ค้นหาจากชื่อ ฉายา สโมสร และลีก</span>
              </div>
            </div>

            <div>
              <div className="sport-search compact-search">
                <Search className="ml-4 h-5 w-5 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาชื่อนักเตะ, ฉายา, สโมสร หรือลีก..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                    title="ล้างคำค้นหา"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500">ลองค้นหา:</span>
                {quickTags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectChip(tag)}
                    className="text-[10px] font-bold text-slate-300 hover:text-blue-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sport-hero">
      <div className="sport-hero-glow" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid items-start gap-7 lg:grid-cols-[1.12fr_.88fr]">
          <div className="home-hero-copy flex flex-col justify-center py-3 lg:py-5">
            <p className="sport-kicker">Football Player Database</p>
            <h1 className="mt-3 max-w-3xl text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-[52px] lg:text-[58px]">
              ค้นหานักฟุตบอล
              <span className="mt-1 block break-words bg-gradient-to-r from-sky-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                จากชื่อ ฉายา <br className="sm:hidden" />สโมสร และลีก
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-[15px]">
              ฐานข้อมูลนักฟุตบอลที่ค้นหาได้ทั้งภาษาไทยและอังกฤษ รองรับชื่อเรียกหลายแบบ
              พร้อมข้อมูลทีม สถิติ สไตล์การเล่น และประวัติของนักเตะ
            </p>

            <div className="sport-search mt-7">
              <Search className="ml-4 h-5 w-5 flex-shrink-0 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อนักเตะ, ฉายา, สโมสร หรือลีก..."
                className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                  title="ล้างคำค้นหา"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-semibold text-slate-400">ค้นหายอดนิยม:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectChip(tag)}
                  className="sport-quick-chip"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="league-orbit-banner mt-7" aria-label="เครือข่ายลีกฟุตบอลทั่วโลก">
              <img
                src="/images/league-orbit-banner-latest.jpg"
                alt="เครือข่ายลีกฟุตบอลทั่วโลก"
                className="league-orbit-banner-image"
              />
            </div>
          </div>
          <div className="h-[520px] sm:h-[560px] lg:h-[610px] lg:w-full lg:max-w-[500px] lg:justify-self-end">
            {featuredPlayer ? (
              <button
                type="button"
                onClick={() => onOpenModal(featuredPlayer)}
                className="spotlight-card spotlight-enter group h-full w-full text-left"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(59,130,246,.45),transparent_34%),linear-gradient(115deg,#071427_0%,#092652_55%,#0b3268_100%)]" />
                <div className="spotlight-lines" />

                <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
                  <div className="flex items-center gap-2 self-start rounded-md border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-300">
                    <Crown className="h-3.5 w-3.5" />
                    Player Spotlight
                  </div>

                  <div className="relative mt-4 max-w-[50%]">
                    <p className="text-xs font-bold text-slate-300">{featuredPlayer.name_th}</p>
                    <h2 className="mt-1 text-2xl font-black leading-[.95] tracking-[-0.045em] text-white sm:text-3xl">
                      {featuredPlayer.name_en}
                    </h2>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
                      {featuredPlayer.flag_url && (
                        <img
                          src={featuredPlayer.flag_url}
                          alt=""
                          className="h-4 w-6 rounded-sm object-cover"
                        />
                      )}
                      <span>{featuredPlayer.national_team?.team_name || 'International'}</span>
                      <span className="text-white/25">|</span>
                      <span>{featuredPlayer.current_team}</span>
                    </div>
                  </div>

                  <div className="mt-auto w-[54%]">
                    <p className="line-clamp-2 text-[11px] leading-5 text-slate-300">
                      {featuredPlayer.profile_summary || featuredPlayer.bio}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        ['ประตู', stats.total_goals || 0],
                        ['แอสซิสต์', stats.total_assists || 0],
                        ['แชมป์', stats.trophies_count || 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-2 py-2.5 text-center backdrop-blur-sm">
                          <div className="text-xl font-black text-white">{value}</div>
                          <div className="mt-0.5 text-[9px] font-semibold text-slate-400">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-blue-300 transition-colors duration-200 group-hover:text-white">
                      <span className="border-b border-blue-400/40 pb-0.5 transition-colors duration-200 group-hover:border-white/60">
                        ดูรายละเอียดนักเตะ
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>

                {spotlightPhotoUrl && (
                  <>
                    {featuredPlayer.photo_url && featuredPlayer.photo_url !== 'N/A' && (
                      <img
                        src={featuredPlayer.photo_url}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="spotlight-player-ghost"
                      />
                    )}
                    <img
                      src={spotlightPhotoUrl}
                      alt={featuredPlayer.name_en}
                      referrerPolicy="no-referrer"
                      className={`spotlight-player-image ${spotlightUsesCutout ? 'is-cutout' : ''}`}
                      style={{
                        width: spotlightImageTuning.width,
                        height: spotlightImageTuning.height,
                        right: spotlightImageTuning.right,
                        objectPosition: spotlightImageTuning.objectPosition,
                        objectFit: spotlightImageTuning.fit,
                        transform: `scale(${spotlightImageTuning.scale})`,
                        transformOrigin: 'bottom right',
                      }}
                    />
                  </>
                )}
                <div className="absolute -right-8 bottom-8 select-none text-[82px] font-black uppercase leading-none tracking-[-0.08em] text-white/[0.035] sm:text-[104px]">
                  {featuredPlayer.nickname || featuredPlayer.name_en.split(' ').slice(-1)[0]}
                </div>
              </button>
            ) : (
              <div className="spotlight-card h-full animate-pulse bg-slate-900/80" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
