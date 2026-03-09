"use client";

import { useState, useEffect, useCallback } from "react";

export function useStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch (e) {
            // 용량 초과 시 imageDataUrl 제거 후 재시도
            console.warn("localStorage 용량 초과, 이미지 제거 후 재시도:", e);
            try {
              const stripped = Array.isArray(next)
                ? (next as Record<string, unknown>[]).map(({ imageDataUrl: _, ...rest }) => rest)
                : next;
              localStorage.setItem(key, JSON.stringify(stripped));
            } catch {
              // 그래도 실패하면 포기
            }
          }
        }
        return next;
      });
    },
    [key]
  );

  return [value, set, loaded] as const;
}
