// ===========================================================================
// useDebounce.js — Custom React Hook สำหรับหน่วงเวลาการพิมพ์ค้นหา (Debounce)
// ===========================================================================

import { useState, useEffect } from 'react';

/**
 * Custom Hook ช่วยชะลอการอัปเดตค่า value จนกว่าผู้ใช้จะหยุดพิมพ์ตามเวลา delay (เช่น 300ms)
 * ช่วยลดจำนวน HTTP Request ที่ยิงไปยัง Backend ตอนพิมพ์ข้อความ
 * 
 * @param {any} value - ค่าข้อมูลที่ต้องการทำ debounce (เช่น ข้อความในช่องค้นหา)
 * @param {number} delay - เวลาที่ต้องการหน่วง (หน่วยมิลลิวินาที, Default = 300ms)
 * @returns {any} debouncedValue - ค่าที่ถูกหน่วงเวลาแล้ว
 */
export function useDebounce(value, delay = 300) {
  // State สำหรับเก็บค่าที่ผ่านการหน่วงเวลาแล้ว
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // ตั้งเวลา (Timer) ให้อัปเดตค่า debouncedValue เมื่อครบกำหนด delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // ล้าง Timer เก่าทิ้งเมื่อผู้ใช้พิมพ์ตัวอักษรใหม่ก่อนที่เวลาจะครบ
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
