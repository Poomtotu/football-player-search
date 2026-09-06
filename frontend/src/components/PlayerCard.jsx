import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
export const PlayerCard = React.memo(function PlayerCard({ player, onOpenModal }) {
 const [imageFailed, setImageFailed] = useState(false);
 useEffect(() => setImageFailed(false), [player.photo_url]);
 const name = player.name_th || player.name_en || 'นักฟุตบอล';
 const stats = player.stats || {};
 const initials = player.name_en?.split(' ').map(word => word[0]).join('').slice(0, 2) || 'FB';
 return <button type="button" className="player-card" onClick={() => onOpenModal(player)} aria-label={'ดูรายละเอียด ' + name}>
 <div className="player-card-top"><span className="league-label">{player.current_league && player.current_league !== 'N/A' ? player.current_league : 'นักฟุตบอล'}</span><ArrowUpRight size={18} className="card-arrow" aria-hidden="true" /></div>
 <div className="player-identity"><div className="player-avatar">{player.photo_url && player.photo_url !== 'N/A' && !imageFailed ? <img src={player.photo_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /> : <span>{initials}</span>}</div><div className="min-w-0"><h3>{name}</h3><p>{player.name_en}</p></div></div>
 <p className="player-team">{player.current_team && player.current_team !== 'N/A' ? player.current_team : 'ไม่ระบุสโมสร'}</p>
 <div className="player-stats">{[['ประตู', stats.total_goals], ['แอสซิสต์', stats.total_assists], ['ถ้วยรางวัล', stats.trophies_count]].map(([label, value]) => <div key={label}><strong>{value == null ? '—' : value.toLocaleString()}</strong><span>{label}</span></div>)}</div>
 <div className="player-card-bottom"><span>{player.national_team?.played && player.national_team.team_name !== 'N/A' ? player.national_team.team_name : 'ดูประวัตินักเตะ'}</span>{player.relevance_score != null ? <span className="match-score">ตรงกัน {Math.round(player.relevance_score * 100)}%</span> : <span>ดูรายละเอียด →</span>}</div>
 </button>;
});
