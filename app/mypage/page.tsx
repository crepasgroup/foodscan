"use client";

import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useDailyStats, getLocalDateStr } from "../hooks/useDailyStats";
import NutrientRing from "../components/NutrientRing";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
type ViewMode = "day" | "week" | "month";
type StatKey = "calories" | "protein" | "carbs" | "fat";

const STAT_OPTIONS: { key: StatKey; label: string; unit: string; color: string; barColor: string }[] = [
  { key: "calories", label: "칼로리", unit: "kcal", color: "#f97316", barColor: "bg-orange-400" },
  { key: "protein", label: "단백질", unit: "g", color: "#3b82f6", barColor: "bg-blue-400" },
  { key: "carbs", label: "탄수화물", unit: "g", color: "#f59e0b", barColor: "bg-amber-400" },
  { key: "fat", label: "지방", unit: "g", color: "#f43f5e", barColor: "bg-rose-400" },
];

function NavArrows({
  onPrev, onNext, disableNext, label,
}: { onPrev: () => void; onNext: () => void; disableNext: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onPrev} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm transition-colors">‹</button>
      <span className="text-xs text-gray-600 min-w-[72px] text-center font-semibold">{label}</span>
      <button onClick={onNext} disabled={disableNext} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm transition-colors disabled:opacity-30">›</button>
    </div>
  );
}

export default function MyPage() {
  const { history, favorites, removeFavorite, settings, exerciseRecords } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekStat, setWeekStat] = useState<StatKey>("calories");

  const goals = settings.goals;
  const weight = settings.weight ?? 65;
  const today = getLocalDateStr();

  // ── 일간 ──
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return getLocalDateStr(d);
  }, [dayOffset]);

  const dayLabel = useMemo(() => {
    if (dayOffset === 0) return "오늘";
    if (dayOffset === -1) return "어제";
    const [, m, d] = selectedDate.split("-");
    return `${parseInt(m)}/${parseInt(d)}`;
  }, [dayOffset, selectedDate]);

  const dayTotals = useMemo(() => {
    return history
      .filter((r) => r.date === selectedDate)
      .reduce(
        (acc, r) => ({
          calories: acc.calories + r.nutrition.nutrition.calories - (r.leftoverCalories || 0),
          protein: acc.protein + r.nutrition.nutrition.protein,
          carbs: acc.carbs + r.nutrition.nutrition.carbs,
          fat: acc.fat + r.nutrition.nutrition.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  }, [history, selectedDate]);

  // ── 주간 ──
  const { weeklyData, weekRangeLabel } = useDailyStats(history, weekOffset);
  const weekLabel = weekOffset === 0 ? "이번 주" : weekOffset === -1 ? "지난 주" : `${Math.abs(weekOffset)}주 전`;

  const activeStat = STAT_OPTIONS.find((s) => s.key === weekStat)!;
  const getStatVal = (d: { calories: number; protein: number; carbs: number; fat: number }) =>
    weekStat === "calories" ? d.calories : weekStat === "protein" ? d.protein : weekStat === "carbs" ? d.carbs : d.fat;
  const maxWeekVal = Math.max(...weeklyData.map(getStatVal), goals[weekStat === "calories" ? "calories" : weekStat]);

  const weekTotals = useMemo(() =>
    weeklyData.reduce((s, d) => ({ calories: s.calories + d.calories, protein: s.protein + d.protein, carbs: s.carbs + d.carbs, fat: s.fat + d.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }), [weeklyData]);

  const weekExercise = weeklyData.reduce((sum, d) => {
    const ex = exerciseRecords.find((r) => r.date === d.date);
    return { steps: sum.steps + (ex?.steps || 0), calories: sum.calories + (ex?.caloriesBurned || 0) };
  }, { steps: 0, calories: 0 });

  // ── 월간 ──
  const monthlyData = useMemo(() => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const y = target.getFullYear();
    const m = target.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m, i + 1);
      const dateStr = getLocalDateStr(d);
      const recs = history.filter((r) => r.date === dateStr);
      return recs.reduce(
        (sum, r) => ({
          ...sum,
          calories: sum.calories + r.nutrition.nutrition.calories - (r.leftoverCalories || 0),
          protein: sum.protein + r.nutrition.nutrition.protein,
          carbs: sum.carbs + r.nutrition.nutrition.carbs,
          fat: sum.fat + r.nutrition.nutrition.fat,
        }),
        { date: dateStr, day: i + 1, calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    });
  }, [history, monthOffset]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    if (monthOffset === 0) return "이번 달";
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  }, [monthOffset]);

  const monthTotals = useMemo(() =>
    monthlyData.reduce((s, d) => ({ calories: s.calories + d.calories, protein: s.protein + d.protein, carbs: s.carbs + d.carbs, fat: s.fat + d.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }), [monthlyData]);

  const maxMonthVal = Math.max(...monthlyData.map(getStatVal), 1);

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

        {/* 영양소 현황 통합 섹션 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 탭 */}
          <div className="flex border-b border-gray-100">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  viewMode === mode
                    ? "text-orange-500 border-b-2 border-orange-400"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {mode === "day" ? "일간" : mode === "week" ? "주간" : "월간"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600">영양소 현황</h2>
              {viewMode === "day" && (
                <NavArrows
                  onPrev={() => setDayOffset((o) => o - 1)}
                  onNext={() => setDayOffset((o) => Math.min(o + 1, 0))}
                  disableNext={dayOffset === 0}
                  label={dayLabel}
                />
              )}
              {viewMode === "week" && (
                <NavArrows
                  onPrev={() => setWeekOffset((o) => o - 1)}
                  onNext={() => setWeekOffset((o) => Math.min(o + 1, 0))}
                  disableNext={weekOffset === 0}
                  label={weekLabel}
                />
              )}
              {viewMode === "month" && (
                <NavArrows
                  onPrev={() => setMonthOffset((o) => o - 1)}
                  onNext={() => setMonthOffset((o) => Math.min(o + 1, 0))}
                  disableNext={monthOffset === 0}
                  label={monthLabel}
                />
              )}
            </div>

            {/* 일간 뷰 */}
            {viewMode === "day" && (
              <div className="flex justify-around">
                <NutrientRing value={dayTotals.calories} max={goals.calories} label="칼로리" unit="kcal" color="#f97316" />
                <NutrientRing value={dayTotals.protein} max={goals.protein} label="단백질" unit="g" color="#3b82f6" />
                <NutrientRing value={dayTotals.carbs} max={goals.carbs} label="탄수화물" unit="g" color="#f59e0b" />
                <NutrientRing value={dayTotals.fat} max={goals.fat} label="지방" unit="g" color="#f43f5e" />
              </div>
            )}

            {/* 주간 뷰 */}
            {viewMode === "week" && (
              <>
                <p className="text-xs text-gray-400 mb-3">{weekRangeLabel}</p>
                {/* 영양소 탭 */}
                <div className="flex gap-1 mb-3">
                  {STAT_OPTIONS.map((s) => (
                    <button key={s.key} onClick={() => setWeekStat(s.key)}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${weekStat === s.key ? "text-white shadow-sm" : "bg-gray-100 text-gray-500"}`}
                      style={weekStat === s.key ? { backgroundColor: s.color } : {}}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {/* 바 차트 */}
                <div className="flex items-end justify-between gap-1 h-24">
                  {weeklyData.map((d) => {
                    const val = getStatVal(d);
                    const pct = maxWeekVal > 0 ? (val / maxWeekVal) * 100 : 0;
                    const isToday = d.date === today;
                    const dow = WEEKDAY[new Date(d.date + "T12:00:00").getDay()];
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-400">{val > 0 ? val : ""}</span>
                        <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                          <div className={`w-full rounded-t-md transition-all duration-700 ${isToday ? activeStat.barColor : activeStat.barColor + "/40"}`}
                            style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }} />
                        </div>
                        <span className={`text-[10px] font-medium ${isToday ? "text-orange-500" : "text-gray-400"}`}>{dow}</span>
                      </div>
                    );
                  })}
                </div>
                {/* 주간 합계 링 */}
                <div className="mt-4 flex justify-around">
                  <NutrientRing value={weekTotals.calories} max={goals.calories * 7} label="칼로리" unit="kcal" color="#f97316" />
                  <NutrientRing value={weekTotals.protein} max={goals.protein * 7} label="단백질" unit="g" color="#3b82f6" />
                  <NutrientRing value={weekTotals.carbs} max={goals.carbs * 7} label="탄수화물" unit="g" color="#f59e0b" />
                  <NutrientRing value={weekTotals.fat} max={goals.fat * 7} label="지방" unit="g" color="#f43f5e" />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">목표 대비 주간 합계</p>
              </>
            )}

            {/* 월간 뷰 */}
            {viewMode === "month" && (
              <>
                {/* 영양소 탭 */}
                <div className="flex gap-1 mb-3">
                  {STAT_OPTIONS.map((s) => (
                    <button key={s.key} onClick={() => setWeekStat(s.key)}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${weekStat === s.key ? "text-white shadow-sm" : "bg-gray-100 text-gray-500"}`}
                      style={weekStat === s.key ? { backgroundColor: s.color } : {}}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {/* 월간 바 차트 */}
                <div className="flex items-end justify-between gap-px h-20">
                  {monthlyData.map((d) => {
                    const val = getStatVal(d);
                    const pct = maxMonthVal > 0 ? (val / maxMonthVal) * 100 : 0;
                    const isToday = d.date === today;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-end justify-end" style={{ height: "80px" }}>
                        <div className={`w-full rounded-t-sm transition-all duration-500 ${isToday ? activeStat.barColor : activeStat.barColor + "/50"}`}
                          style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }} />
                      </div>
                    );
                  })}
                </div>
                {/* 날짜 레이블 (1, 10, 20, 말일만) */}
                <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-0.5">
                  <span>1일</span>
                  <span>10일</span>
                  <span>20일</span>
                  <span>{monthlyData.length}일</span>
                </div>
                {/* 월간 합계 */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: "칼로리", value: monthTotals.calories, unit: "kcal", color: "text-orange-500" },
                    { label: "단백질", value: monthTotals.protein, unit: "g", color: "text-blue-500" },
                    { label: "탄수화물", value: monthTotals.carbs, unit: "g", color: "text-amber-500" },
                    { label: "지방", value: monthTotals.fat, unit: "g", color: "text-rose-500" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className={`text-sm font-extrabold ${s.color}`}>{s.value.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                      <p className="text-[9px] text-gray-300">{s.unit}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">월간 합계</p>
              </>
            )}
          </div>
        </section>

        {/* 운동 현황 (주간 기준) */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">
            {weekOffset === 0 ? "이번 주 운동" : weekOffset === -1 ? "지난 주 운동" : `${Math.abs(weekOffset)}주 전 운동`}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-500">{weekExercise.steps.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">총 걸음수</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-green-500">{weekExercise.calories}</p>
              <p className="text-xs text-gray-500 mt-0.5">소모 칼로리 (kcal)</p>
            </div>
          </div>
          {weekExercise.steps === 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">🏃 운동 탭에서 걸음수를 기록해보세요</p>
          )}
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
                      <div className={`w-full rounded-t-md transition-all duration-700 ${isToday ? "bg-blue-400" : "bg-blue-200"}`}
                        style={{ height: `${Math.max(pct, steps > 0 ? 4 : 0)}%` }} />
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? "text-blue-500" : "text-gray-400"}`}>{dow}</span>
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
            <p className="text-sm text-gray-400 text-center py-4">☆ 기록에서 즐겨찾기를 추가해보세요</p>
          ) : (
            <div className="space-y-2">
              {favorites.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.servingSize}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-500">{f.nutrition.calories} kcal</span>
                    <button onClick={() => removeFavorite(f.id)} className="text-gray-300 hover:text-red-400 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 전체 현황 */}
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
              <p className="text-2xl font-extrabold text-green-500">{monthlyData.filter((d) => d.calories > 0).length}</p>
              <p className="text-xs text-gray-500 mt-0.5">이달 기록일</p>
            </div>
          </div>
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
