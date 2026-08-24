import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * หน่วงเวลาค่าการพิมพ์ 300ms (หรือกำหนดได้) เพื่อลดจำนวน request ไปยัง API
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
