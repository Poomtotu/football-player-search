import React, { useEffect, useState } from 'react';
import {
  Home,
  Trophy,
  Users,
} from 'lucide-react';

const NAV_SCROLL_OFFSET = 84;

export function Navbar({ backendReady, totalPlayers, onResetSearch, isSearchMode = false }) {
  const [activeHref, setActiveHref] = useState(() => {
    const hash = window.location.hash;
    return hash === '#players' || hash === '#leagues' ? hash : '#top';
  });

  const navItems = [
    ['หน้าแรก', '#top', Home, true],
    ['นักเตะทั้งหมด', '#players', Users, true],
    ['ลีก', '#leagues', Trophy, false],
  ];

  useEffect(() => {
    if (isSearchMode) {
      setActiveHref('#players');
    }
  }, [isSearchMode]);

  const scrollToSection = (href) => {
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.querySelector(href);
    if (!target) return;

    const targetTop = target.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  };

  const handleNavClick = (event, href, shouldReset) => {
    event.preventDefault();
    setActiveHref(href);
    window.history.replaceState(null, '', href);

    if (shouldReset) {
      onResetSearch?.();
    }

    // Wait for React to finish the layout change before measuring the target.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSection(href);
      });
    });
  };

  return (
    <header id="top" className="site-nav-enter sticky top-0 z-40 border-b border-white/10 bg-[#061225]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          onClick={(event) => handleNavClick(event, '#top', true)}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="brand-mark flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10">
            <Trophy className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[16px] font-black leading-none tracking-[0.04em]">
              FOOTBALL<span className="text-blue-400">.IR</span>
            </div>
            <p className="mt-1.5 hidden truncate text-[9px] font-medium text-slate-400 sm:block">
              ระบบค้นหาและจัดการประวัตินักเตะ
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map(([label, href, Icon, shouldReset]) => {
            const active = activeHref === href;

            return (
              <a
                key={label}
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => handleNavClick(event, href, shouldReset)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                  active
                    ? 'border border-blue-400/30 bg-blue-600/20 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
