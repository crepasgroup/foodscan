"use client";

import { useState } from "react";
import Image from "next/image";
import { useApp } from "../context/AppContext";
import { HistoryRecord, MealType, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from "../types";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${m}월 ${d}일`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecordCard({
  record,
  isFaved,
  onDelete,
  onToggleFavorite,
}: {
  record: HistoryRecord;
  isFaved: boolean;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const n = record.nutrition.nutrition;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex gap-3 p-4">
        {record.imageDataUrl && (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            <Image
              src={record.imageDataUrl}
              alt={record.nutrition.foodName}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {record.mealType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 font-medium flex-shrink-0">
                    {MEAL_TYPE_ICONS[record.mealType]} {MEAL_TYPE_LABELS[record.mealType]}
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-900 truncate">
                {record.nutrition.foodName}
              </p>
              <p className="text-xs text-gray-400">{formatTime(record.timestamp)}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onToggleFavorite}
                className="text-xl hover:scale-110 transition-transform"
              >
                {isFaved ? "⭐" : "☆"}
              </button>
              <button
                onClick={onDelete}
                className="text-lg text-gray-300 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span className="font-bold text-orange-500">{n.calories} kcal</span>
            <span>단백질 {n.protein}g</span>
            <span>탄수 {n.carbs}g</span>
            <span>지방 {n.fat}g</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterType = "all" | MealType | "favorite";

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all", label: "전체", icon: "📋" },
  { key: "breakfast", label: "아침", icon: "🌅" },
  { key: "lunch", label: "점심", icon: "☀️" },
  { key: "dinner", label: "저녁", icon: "🌙" },
  { key: "snack", label: "간식", icon: "🍪" },
  { key: "favorite", label: "즐겨찾기", icon: "⭐" },
];

export default function HistoryPage() {
  const { history, favorites, deleteRecord, addFavorite, removeFavorite } = useApp();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredHistory = history.filter((r) => {
    if (filter === "all") return true;
    if (filter === "favorite") return favorites.some((f) => f.id === r.id);
    return r.mealType === filter;
  });

  // 날짜별 그룹핑
  const grouped = filteredHistory.reduce<Record<string, HistoryRecord[]>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleToggleFavorite = (record: HistoryRecord) => {
    const isFaved = favorites.some((f) => f.id === record.id);
    if (isFaved) {
      removeFavorite(record.id);
    } else {
      addFavorite(record);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-extrabold text-gray-900">식사 기록</h1>
          <p className="text-xs text-gray-500">총 {history.length}개 기록</p>
        </div>
        {/* 필터 탭 */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.key
                  ? "bg-orange-400 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {sortedDates.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">
              {filter === "all" ? "아직 기록이 없어요" : "해당 기록이 없어요"}
            </p>
            <p className="text-sm mt-1">음식을 분석하면 자동으로 기록됩니다</p>
          </div>
        )}

        {sortedDates.map((date) => {
          const records = grouped[date];
          const dayTotal = records.reduce(
            (sum, r) => sum + r.nutrition.nutrition.calories,
            0
          );
          return (
            <section key={date}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-600">
                  {formatDate(date)}
                </h2>
                <span className="text-xs text-orange-500 font-bold">
                  합계 {dayTotal} kcal
                </span>
              </div>
              <div className="space-y-2">
                {records.map((r) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    isFaved={favorites.some((f) => f.id === r.id)}
                    onDelete={() => deleteRecord(r.id)}
                    onToggleFavorite={() => handleToggleFavorite(r)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
