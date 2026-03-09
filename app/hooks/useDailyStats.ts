"use client";

import { useMemo } from "react";
import { HistoryRecord } from "../types";

export function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useDailyStats(history: HistoryRecord[], weekOffset: number = 0) {
  const today = useMemo(() => getLocalDateStr(), []);

  const todayRecords = useMemo(
    () => history.filter((r) => r.date === today),
    [history, today]
  );

  const todayTotals = useMemo(() => {
    return todayRecords.reduce(
      (acc, r) => ({
        calories: acc.calories + r.nutrition.nutrition.calories - (r.leftoverCalories || 0),
        protein: acc.protein + r.nutrition.nutrition.protein,
        carbs: acc.carbs + r.nutrition.nutrition.carbs,
        fat: acc.fat + r.nutrition.nutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayRecords]);

  // weekOffset 기반 7일 통계 (0=이번주, -1=지난주)
  const weeklyData = useMemo(() => {
    const result: { date: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      // weekOffset * 7 days shift + i days back
      d.setDate(d.getDate() + weekOffset * 7 - i);
      const dateStr = getLocalDateStr(d);
      const dayRecords = history.filter((r) => r.date === dateStr);
      const totals = dayRecords.reduce(
        (sum, r) => ({
          calories: sum.calories + r.nutrition.nutrition.calories - (r.leftoverCalories || 0),
          protein: sum.protein + r.nutrition.nutrition.protein,
          carbs: sum.carbs + r.nutrition.nutrition.carbs,
          fat: sum.fat + r.nutrition.nutrition.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      result.push({ date: dateStr, ...totals });
    }
    return result;
  }, [history, weekOffset]);

  // 주간 범위 문자열 (예: "3/3 ~ 3/9")
  const weekRangeLabel = useMemo(() => {
    if (weeklyData.length === 0) return "";
    const first = weeklyData[0].date;
    const last = weeklyData[weeklyData.length - 1].date;
    const fmt = (s: string) => {
      const [, m, d] = s.split("-");
      return `${parseInt(m)}/${parseInt(d)}`;
    };
    return `${fmt(first)} ~ ${fmt(last)}`;
  }, [weeklyData]);

  return { today, todayRecords, todayTotals, weeklyData, weekRangeLabel };
}
