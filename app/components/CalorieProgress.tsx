"use client";

import { useApp } from "../context/AppContext";
import { useDailyStats } from "../hooks/useDailyStats";

export default function CalorieProgress() {
  const { history, settings } = useApp();
  const { todayTotals } = useDailyStats(history);
  const goal = settings.goals.calories;
  const pct = Math.min((todayTotals.calories / goal) * 100, 100);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">오늘 칼로리</span>
        <span className="text-sm text-gray-500">
          <span className="font-bold text-orange-500">{todayTotals.calories}</span>
          {" / "}{goal} kcal
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${
            pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-orange-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>단백질 {todayTotals.protein}g</span>
        <span>탄수화물 {todayTotals.carbs}g</span>
        <span>지방 {todayTotals.fat}g</span>
      </div>
    </div>
  );
}
