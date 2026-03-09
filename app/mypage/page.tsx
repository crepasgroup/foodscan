"use client";

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useDailyStats, getLocalDateStr } from "../hooks/useDailyStats";
import NutrientRing from "../components/NutrientRing";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

type StatKey = "calories" | "protein" | "carbs" | "fat";

const STAT_OPTIONS: { key: StatKey; label: string; unit: string; color: string; barColor: string }[] = [
  { key: "calories", label: "칼로리", unit: "kcal", color: "#f97316", barColor: "bg-orange-400" },
  { key: "protein", label: "단백질", unit: "g", color: "#3b82f6", barColor: "bg-blue-400" },
  { key: "carbs", label: "탄수화물", unit: "g", color: "#f59e0b", barColor: "bg-amber-400" },
  { key: "fat", label: "지방", unit: "g", color: "#f43f5e", barColor: "bg-rose-400" },
];

export default function MyPage() {
  const { history, favorites, removeFavorite, settings, exerciseRecords } = useApp();
  const [weekStat, setWeekStat] = useState<StatKey>("calories");
  const [weekOffset, setWeekOffset] = useState(0);

  const { todayTotals, weeklyData, weekRangeLabel } = useDailyStats(history, weekOffset);
  const goals = settings.goals;
  const weight = settings.weight ?? 65;

  const activeStat = STAT_OPTIONS.find((s) => s.key === weekStat)!;

  const weekGoalValue = goals[weekStat === "calories" ? "calories" : weekStat];
  const getStatVal = (d: { date: string; calories: number; protein: number; carbs: number; fat: number }) =>
    weekStat === "calories" ? d.calories : weekStat === "protein" ? d.protein : weekStat === "carbs" ? d.carbs : d.fat;
  const maxWeekVal = Math.max(...weeklyData.map(getStatVal), weekGoalValue);

  // 주간 운동 합계
  const weekExercise = weeklyData.reduce((sum, d) => {
    const ex = exerciseRecords.find((r) => r.date === d.date);
    return {
      steps: sum.steps + (ex?.steps || 0),
      calories: sum.calories + (ex?.caloriesBurned || 0),
    };
  }, { steps: 0, calories: 0 });

  const today = getLocalDateStr();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-extrabold text-gray-900">
            {settings.name ? `${settings.name}님의 마이페이지` : "마이페이지"}
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* 오늘 현황 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">오늘 영양소</h2>
          <div className="flex justify-around">
            <NutrientRing
              value={todayTotals.calories}
              max={goals.calories}
              label="칼로리"
              unit="kcal"
              color="#f97316"
            />
            <NutrientRing
              value={todayTotals.protein}
              max={goals.protein}
              label="단백질"
              unit="g"
              color="#3b82f6"
            />
            <NutrientRing
              value={todayTotals.carbs}
              max={goals.carbs}
              label="탄수화물"
              unit="g"
              color="#f59e0b"
            />
            <NutrientRing
              value={todayTotals.fat}
              max={goals.fat}
              label="지방"
              unit="g"
              color="#f43f5e"
            />
          </div>
        </section>

        {/* 주간 차트 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {/* 헤더: 주간 네비게이션 */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-600">주간 통계</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm transition-colors"
              >
                ‹
              </button>
              <span className="text-xs text-gray-500 min-w-[80px] text-center font-medium">
                {weekOffset === 0 ? "이번 주" : weekOffset === -1 ? "지난 주" : `${Math.abs(weekOffset)}주 전`}
              </span>
              <button
                onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
                disabled={weekOffset === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm transition-colors disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">{weekRangeLabel}</p>
          {/* 영양소 선택 탭 */}
          <div className="flex gap-1 mb-3">
            {STAT_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setWeekStat(s.key)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
                  weekStat === s.key
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                style={weekStat === s.key ? { backgroundColor: s.color } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-end justify-between gap-1 h-28">
            {weeklyData.map((d) => {
              const val = getStatVal(d);
              const pct = maxWeekVal > 0 ? (val / maxWeekVal) * 100 : 0;
              const isToday = d.date === today;
              const dow = WEEKDAY[new Date(d.date + "T12:00:00").getDay()];
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400">
                    {val > 0 ? val : ""}
                  </span>
                  <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        isToday ? activeStat.barColor : activeStat.barColor + "/40"
                      }`}
                      style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? "text-orange-500" : "text-gray-400"}`}>
                    {dow}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            목표: {weekGoalValue} {activeStat.unit}/일
          </p>
        </section>

        {/* 이번주 운동 섹션 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">
            {weekOffset === 0 ? "이번 주 운동" : weekOffset === -1 ? "지난 주 운동" : `${Math.abs(weekOffset)}주 전 운동`}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-500">
                {weekExercise.steps.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">총 걸음수</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-green-500">
                {weekExercise.calories}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">소모 칼로리 (kcal)</p>
            </div>
          </div>
          {weekExercise.steps === 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              🏃 운동 탭에서 걸음수를 기록해보세요
            </p>
          )}
          {/* 일별 걸음수 바 */}
          {weekExercise.steps > 0 && (
            <div className="mt-3 flex items-end justify-between gap-1 h-16">
              {weeklyData.map((d) => {
                const ex = exerciseRecords.find((r) => r.date === d.date);
                const steps = ex?.steps || 0;
                const goalSteps = settings.goalSteps ?? 10000;
                const pct = goalSteps > 0 ? Math.min((steps / goalSteps) * 100, 100) : 0;
                const isToday = d.date === today;
                const dow = WEEKDAY[new Date(d.date + "T12:00:00").getDay()];
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "40px" }}>
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 ${
                          isToday ? "bg-blue-400" : "bg-blue-200"
                        }`}
                        style={{ height: `${Math.max(pct, steps > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? "text-blue-500" : "text-gray-400"}`}>
                      {dow}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 즐겨찾기 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">즐겨찾기 음식</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              ☆ 기록에서 즐겨찾기를 추가해보세요
            </p>
          ) : (
            <div className="space-y-2">
              {favorites.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.servingSize}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-500">
                      {f.nutrition.calories} kcal
                    </span>
                    <button
                      onClick={() => removeFavorite(f.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 간단 요약 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">전체 현황</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-orange-500">{history.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">총 기록</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-amber-500">{favorites.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">즐겨찾기</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-green-500">
                {weeklyData.filter((d) => d.calories > 0).length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {weekOffset === 0 ? "이번주 기록일" : "해당주 기록일"}
              </p>
            </div>
          </div>
          {/* 신체 정보 표시 */}
          {(settings.height || settings.weight) && (
            <div className="mt-3 flex gap-3">
              {settings.height && (
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-gray-700">{settings.height} <span className="text-sm font-normal">cm</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">키</p>
                </div>
              )}
              {settings.weight && (
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-gray-700">{weight} <span className="text-sm font-normal">kg</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">몸무게</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
