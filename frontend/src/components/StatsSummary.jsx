// ===========================================================================
// StatsSummary.jsx — แถบสรุปผลลัพธ์และความเร็วการค้นหา (Search Stats Bar)
// ===========================================================================

import React from 'react';
import { Zap, Cpu } from 'lucide-react';

/**
 * คอมโพเนนต์ StatsSummary สำหรับแสดงจำนวนรายการนักเตะที่พบ, คำค้นหาปัจจุบัน, เวลาความเร็ว (ms), และอัลกอริทึม IR
 * 
 * @param {number} totalShown - จำนวนรายการนักเตะที่แสดงในหน้าปัจจุบัน
 * @param {number} totalAll - จำนวนนักเตะทั้งหมดในฐานข้อมูล
 * @param {string} query - คำค้นหาปัจจุบัน
 * @param {number} searchTime - ความเร็วการค้นหาในหน่วย millisecond (ms)
 */
export function StatsSummary({ totalShown, totalAll, query, searchTime }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs">
        
        {/* --- ส่วนแสดงจำนวนผลลัพธ์ --- */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-600">
            {query ? (
              <>
                ผลการค้นหา: <strong className="text-blue-600 font-black text-sm">{totalShown}</strong> รายการ
                <span className="text-gray-400 ml-1.5 hidden sm:inline">(สำหรับ "{query}")</span>
              </>
            ) : (
              <>
                แสดงนักเตะยอดนิยม: <strong className="text-blue-600 font-black text-sm">{totalShown}</strong> จาก {totalAll} คน
              </>
            )}
          </span>
        </div>

        {/* --- ส่วนแสดง Latency ความเร็ว (ms) และเครื่องยนต์ IR --- */}
        <div className="flex items-center space-x-3 text-[11px] text-gray-500 font-medium">
          {searchTime !== null && (
            <span className="hidden md:inline-flex items-center text-gray-500">
              <Zap className="w-3.5 h-3.5 text-amber-500 mr-1" />
              ความเร็ว: <strong className="text-gray-800 ml-1">{searchTime} ms</strong>
            </span>
          )}
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700">
            <Cpu className="w-3.5 h-3.5 text-blue-600 mr-1" />
            Okapi BM25 + RapidFuzz WRatio
          </span>
        </div>
      </div>
    </div>
  );
}
