"use client";

import { useState, useRef } from "react";
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
  onUpdateLeftover,
}: {
  record: HistoryRecord;
  isFaved: boolean;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onUpdateLeftover: (leftoverCalories: number | undefined) => void;
}) {
  const n = record.nutrition.nutrition;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLeftover, setShowLeftover] = useState(false);
  const [leftoverFile, setLeftoverFile] = useState<File | null>(null);
  const [leftoverPreview, setLeftoverPreview] = useState<string | null>(null);
  const [leftoverAnalyzing, setLeftoverAnalyzing] = useState(false);
  const [leftoverResult, setLeftoverResult] = useState<number | null>(null);
  const [leftoverError, setLeftoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveCalories = n.calories - (record.leftoverCalories || 0);

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
  };

  const handleLeftoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLeftoverFile(file);
    setLeftoverResult(null);
    setLeftoverError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLeftoverPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLeftoverAnalyze = async () => {
    if (!leftoverFile) return;
    setLeftoverAnalyzing(true);
    setLeftoverError(null);
    try {
      const formData = new FormData();
      formData.append("image", leftoverFile, "image.jpg");
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const text = await res.text();
      let data: { error?: string; nutrition?: { nutrition?: { calories?: number } } };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("서버 오류가 발생했습니다.");
      }
      if (!res.ok) throw new Error(data.error || "분석 실패");
      const calories = (data as { nutrition?: { nutrition?: { calories?: number } } })?.nutrition?.nutrition?.calories;
      if (calories !== undefined) {
        setLeftoverResult(calories);
      } else {
        // data itself might be NutritionData structure
        const nd = data as { nutrition?: { calories?: number } };
        const cal2 = nd?.nutrition?.calories;
        if (cal2 !== undefined) {
          setLeftoverResult(cal2);
        } else {
          setLeftoverResult(0);
        }
      }
    } catch (err) {
      setLeftoverError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setLeftoverAnalyzing(false);
    }
  };

  const handleLeftoverApply = () => {
    if (leftoverResult === null) return;
    onUpdateLeftover(leftoverResult);
    setShowLeftover(false);
    setLeftoverFile(null);
    setLeftoverPreview(null);
    setLeftoverResult(null);
  };

  const handleLeftoverCancel = () => {
    setShowLeftover(false);
    setLeftoverFile(null);
    setLeftoverPreview(null);
    setLeftoverResult(null);
    setLeftoverError(null);
  };

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
              {/* 삭제 버튼 + 인라인 확인 */}
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">삭제?</span>
                  <button
                    onClick={handleDeleteClick}
                    className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white font-semibold"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDeleteClick}
                  className="text-lg text-gray-300 hover:text-red-400 transition-colors"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            <span className="font-bold text-orange-500">{n.calories} kcal</span>
            {record.leftoverCalories ? (
              <span className="text-green-600 font-semibold">
                실제: {effectiveCalories} kcal ({record.leftoverCalories} kcal 제외)
              </span>
            ) : null}
            <span>단백질 {n.protein}g</span>
            <span>탄수 {n.carbs}g</span>
            <span>지방 {n.fat}g</span>
          </div>
          {/* 남긴음식 등록 버튼 */}
          <button
            onClick={() => setShowLeftover((v) => !v)}
            className="mt-2 text-xs text-gray-400 hover:text-orange-500 transition-colors"
          >
            🍽️ 남긴음식 등록
          </button>
        </div>
      </div>

      {/* 남긴음식 인라인 UI */}
      {showLeftover && (
        <div className="border-t border-gray-100 p-4 bg-orange-50/30 space-y-3">
          <p className="text-xs font-semibold text-gray-600">남긴 음식 사진을 업로드하세요</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLeftoverFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-xl border-2 border-dashed border-orange-300 text-sm text-orange-500 font-semibold hover:bg-orange-50 transition-colors"
          >
            {leftoverFile ? leftoverFile.name : "사진 선택"}
          </button>
          {leftoverPreview && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={leftoverPreview} alt="남긴음식" className="w-full h-full object-contain" />
            </div>
          )}
          {leftoverFile && !leftoverResult && (
            <button
              onClick={handleLeftoverAnalyze}
              disabled={leftoverAnalyzing}
              className="w-full py-2 rounded-xl bg-orange-400 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {leftoverAnalyzing ? "분석 중..." : "🔍 분석하기"}
            </button>
          )}
          {leftoverError && (
            <p className="text-xs text-red-500">{leftoverError}</p>
          )}
          {leftoverResult !== null && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                남긴음식: <span className="text-orange-500">{leftoverResult} kcal</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleLeftoverApply}
                  className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:opacity-90 transition-all"
                >
                  적용
                </button>
                <button
                  onClick={handleLeftoverCancel}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          {!leftoverFile && (
            <button
              onClick={handleLeftoverCancel}
              className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          )}
        </div>
      )}
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
  const { history, favorites, deleteRecord, addFavorite, removeFavorite, updateLeftover } = useApp();
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
            (sum, r) => sum + r.nutrition.nutrition.calories - (r.leftoverCalories || 0),
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
                    onUpdateLeftover={(lc) => updateLeftover(r.id, lc)}
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
