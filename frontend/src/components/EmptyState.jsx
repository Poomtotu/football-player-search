// ===========================================================================
// EmptyState.jsx — คอมโพเนนต์แสดงเมื่อไม่พบผลการค้นหา (Empty Search State View)
// ===========================================================================

import React from 'react';
import { SearchX, Sparkles, RefreshCw } from 'lucide-react';

/**
 * คอมโพเนนต์ EmptyState แสดงข้อความเมื่อไม่พบผลลัพธ์การค้นหา พร้อมชิปคำแนะนำทางเลือก และปุ่มรีเซ็ต
 * 
 * @param {string} query - คำค้นหาที่ไม่พบผลลัพธ์
 * @param {function} onReset - ฟังก์ชันรีเซ็ตคำค้นหาเป็นค่าว่าง
 * @param {function} onSelectChip - ฟังก์ชันเลือกชิปคำค้นหาทางเลือก
 */
export function EmptyState({ query, onReset, onSelectChip }) {
  // รายการคำค้นหาทางเลือกที่แนะนำ
  const suggestions = ['เมสซี่', 'CR7', 'ฮาลันด์', 'ซาลาห์', 'เอ็มบัปเป', 'เบลลิงแฮม'];

  return (
    <div className="max-w-lg mx-auto my-16 text-center px-6 py-12 animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-5 text-zinc-400">
        <SearchX className="w-5 h-5" />
      </div>

      {/* ข้อความแจ้งเตือน */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        ไม่พบผลการค้นหา
      </h3>

      <p className="text-sm text-zinc-500 mb-7 leading-6">
        ไม่พบนักเตะที่ตรงกับคำว่า <span className="text-zinc-900 font-semibold">“{query}”</span><br />
        ลองค้นหาด้วยชื่อ ฉายา สโมสร หรือลีกแทน
      </p>

      {/* คำแนะนำคำค้นหาทางเลือก */}
      <div className="mb-6">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.16em] mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>Suggested searches</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => onSelectChip(item)}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 border-b border-transparent hover:border-zinc-950"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* ปุ่มกดดูนักเตะทั้งหมด (Reset) */}
      <button
        onClick={onReset}
        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>ดูนักเตะทั้งหมด</span>
      </button>
    </div>
  );
}
