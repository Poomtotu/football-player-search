import React, { useRef } from 'react';
import { Search, X, Loader2, ArrowUpRight } from 'lucide-react';
const leagues = ['ทั้งหมด', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Saudi Pro League', 'Major League Soccer'];
export function HeroSearch({ query, setQuery, loading, selectedLeague, setSelectedLeague, onSelectChip }) {
 const input = useRef(null);
 return <section className="search-hero" aria-labelledby="search-heading">
 <p className="eyebrow">THE BEAUTIFUL GAME, ONE SEARCH AWAY</p>
 <h1 id="search-heading">ทุกเรื่องของนักเตะ<br /><span>เริ่มที่การค้นหา</span></h1>
 <p className="hero-description">รู้จักนักเตะคนโปรดให้มากขึ้น ค้นหาด้วยชื่อไทย อังกฤษ หรือฉายา</p>
 <div className="search-field" role="search">
 {loading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Search aria-hidden="true" />}
 <label htmlFor="player-search" className="sr-only">ค้นหาชื่อนักฟุตบอลหรือฉายา</label>
 <input ref={input} id="player-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="เช่น เมสซี่, Ronaldo หรือ CR7" autoComplete="off" />
 {query && <button className="clear-search" aria-label="ล้างคำค้นหา" onClick={() => { setQuery(''); input.current?.focus(); }}><X size={18} /></button>}
 </div>
 <div className="suggestions"><span>ลองค้นหา</span>{['เมสซี่', 'โรนัลโด้', 'บังโม', 'ฮาแลนด์'].map(name => <button key={name} onClick={() => onSelectChip(name)}>{name}<ArrowUpRight size={13} aria-hidden="true" /></button>)}</div>
 <div className="league-filter" role="group" aria-label="กรองตามลีก">{leagues.map(league => <button key={league} aria-pressed={selectedLeague === league} onClick={() => setSelectedLeague(league)}>{league === 'ทั้งหมด' ? 'ทุกลีก' : league}</button>)}</div>
 </section>;
}
