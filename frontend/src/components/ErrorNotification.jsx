import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff, WifiOff, X } from 'lucide-react';

export function ErrorNotification({ error, onRetry, onDismiss, isRetrying }) {
  if (!error) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up">
      <div className="bg-dark-800/95 border-2 border-rose-500/60 shadow-2xl rounded-2xl p-4 backdrop-blur-xl flex items-start space-x-3.5 text-slate-100">
        <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl flex-shrink-0 mt-0.5">
          <ServerOff className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>ระบบหลังบ้านขัดข้อง</span>
            </h4>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            {error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend (http://localhost:8000) ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดใช้งานอยู่'}
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-500/30 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'กำลังเชื่อมต่อใหม่...' : 'ลองเชื่อมต่อใหม่ (Retry)'}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              พอร์ต 8000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
