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
  const suggestions = ['เมสซี่', 'CR7', 'ฮาลันด์', 'ซาลาห์', 'เอ็มบัปเป', 'Real Madrid'];

  return (
    <div className="max-w-md mx-auto my-12 text-center p-8 rounded-3xl bg-white border border-gray-200 shadow-sm animate-fade-in">
      {/* ไอคอนไม่พบข้อมูล */}
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-sm">
        <SearchX className="w-8 h-8" />
      </div>

      {/* ข้อความแจ้งเตือน */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        ไม่พบผลการค้นหา
      </h3>

      <p className="text-xs sm:text-sm text-gray-500 mb-6">
        ไม่พบนักเตะที่ตรงกับคำว่า <span className="text-blue-600 font-semibold">"{query}"</span><br />
        ลองค้นหาด้วยชื่อย่อ, ฉายา หรือชื่อสโมสรแทน
      </p>

      {/* คำแนะนำคำค้นหาทางเลือก */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>ลองค้นหาคำเหล่านี้:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => onSelectChip(item)}
              className="px-3 py-1.5 rounded-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors shadow-clean-sm"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* ปุ่มกดดูนักเตะทั้งหมด (Reset) */}
      <button
        onClick={onReset}
        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>ดูนักเตะทั้งหมด</span>
      </button>
    </div>
  );
}
