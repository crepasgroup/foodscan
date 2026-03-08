"use client";

import { useMemo } from "react";
import { HistoryRecord } from "../types";

export function useDailyStats(history: HistoryRecord[]) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayRecords = useMemo(
    () => history.filter((r) => r.date === today),
    [history, today]
  );

  const todayTotals = useMemo(() => {
    return todayRecords.reduce(
      (acc, r) => ({
        calories: acc.calories + r.nutrition.nutrition.calories,
        protein: acc.protein + r.nutrition.nutrition.protein,
        carbs: acc.carbs + r.nutrition.nutrition.carbs,
        fat: acc.fat + r.nutrition.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayRecords]);

  // 최근 7일 통계
  const weeklyData = useMemo(() => {
    const result: { date: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayRecords = history.filter((r) => r.date === dateStr);
      const totals = dayRecords.reduce(
        (sum, r) => ({
          calories: sum.calories + r.nutrition.nutrition.calories,
          protein: sum.protein + r.nutrition.nutrition.protein,
          carbs: sum.carbs + r.nutrition.nutrition.carbs,
          fat: sum.fat + r.nutrition.nutrition.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      result.push({ date: dateStr, ...totals });
    }
    return result;
  }, [history]);

  return { today, todayRecords, todayTotals, weeklyData };
}
