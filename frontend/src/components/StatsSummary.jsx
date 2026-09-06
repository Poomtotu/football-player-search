import React from 'react';
export function StatsSummary({ totalShown, query }) {
 return <div className="results-summary" role="status" aria-live="polite"><div><h2>{query ? 'ผลการค้นหา “' + query + '”' : 'สำรวจนักเตะ'}</h2><p>{query ? 'เรียงตามความเกี่ยวข้องกับคำค้นหา' : 'เลือกนักเตะเพื่อดูสถิติและประวัติฉบับเต็ม'}</p></div><span className="result-count">{totalShown.toLocaleString()} คน</span></div>;
}
