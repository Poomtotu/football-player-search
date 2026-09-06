import React from 'react';
import { Trophy } from 'lucide-react';
export function Navbar({ backendReady, totalPlayers }) {
 return <header className="site-header"><div className="header-inner">
 <a href="#search-heading" className="brand" aria-label="Football IR ไปที่ช่องค้นหา"><span className="brand-icon"><Trophy size={20} /></span><span>FOOTBALL<span className="text-blue-600">.IR</span></span></a>
 <div className="header-meta"><span className="hidden sm:inline">นักเตะ {totalPlayers.toLocaleString()} คน</span><span className="connection-status"><span className={backendReady ? 'status-dot ready' : 'status-dot'} />{backendReady ? 'พร้อมค้นหา' : 'ยังไม่เชื่อมต่อ'}</span></div>
 </div></header>;
}
