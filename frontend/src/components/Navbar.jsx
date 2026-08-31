// ===========================================================================
// Navbar.jsx — แถบ Header นำทางด้านบนของเว็บไซต์ (Clean White Theme)
// ===========================================================================

import React from 'react';
import { BookOpen, Database, Sparkles, Trophy, Search } from 'lucide-react';
import { API_ENDPOINTS } from '../config';

/**
 * คอมโพเนนต์ Navbar สำหรับแสดงโลโก้, เมนูเปลี่ยนหน้า (Search / User Profile), สถานะ API, และลิงก์ไปยัง Swagger Docs
 */
export function Navbar({ backendReady, totalPlayers }) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* --- ส่วนโลโก้และชื่อแบรนด์ (Logo & Brand) --- */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-tight text-gray-900">
                FOOTBALL<span className="text-blue-600">.IR</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold tracking-wide bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-blue-600" />
                BM25 + Fuzzy
              </span>
            </div>
            <p className="text-[11px] text-gray-500 hidden sm:block font-medium">
              ระบบค้นหาและจัดการประวัตินักเตะ
            </p>
          </div>
        </div>


        {/* --- ส่วนขวา: ข้อมูลฐานข้อมูล, สถานะเซิร์ฟเวอร์, และลิงก์ Swagger API --- */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* 1. จำนวนข้อมูลในฐานข้อมูล */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>ฐานข้อมูล:</span>
            <span className="font-bold text-gray-900">{totalPlayers || 100} คน</span>
          </div>

          {/* 2. ไฟแสดงสถานะการเชื่อมต่อ Backend (Online / Offline Indicator) */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              {backendReady && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${backendReady ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-gray-600 hidden sm:inline">
              API: <strong className={backendReady ? 'text-emerald-600' : 'text-rose-500'}>{backendReady ? 'Online' : 'Offline'}</strong>
            </span>
          </div>

          {/* 3. ปุ่มเปิดหน้า Swagger API Documentation */}
          <a
            href={API_ENDPOINTS.docs}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all shadow-sm hover:shadow"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Swagger</span> API Docs
          </a>
        </div>
      </div>
    </header>
  );
}
