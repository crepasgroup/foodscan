"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import ImageUpload from "./components/ImageUpload";
import NutritionCard from "./components/NutritionCard";
import CalorieProgress from "./components/CalorieProgress";
import LoginModal from "./components/LoginModal";
import { NutritionData, MealType, MEAL_TYPE_LABELS, MEAL_TYPE_ICONS } from "./types";
import { useApp } from "./context/AppContext";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function getMealTypeByHour(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}

export default function Home() {
  const { addRecord } = useApp();
  const { data: session } = useSession();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<NutritionData[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mealType, setMealType] = useState<MealType>(getMealTypeByHour());
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setResults([]);
    setSavedIds(new Set());
    setError(null);
  };

  // localStorage 저장용 100x100px 소형 썸네일 생성 (~5KB)
  const createThumbnail = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const SIZE = 100;
        const scale = Math.min(1, SIZE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve("");
      img.src = src;
    });
  };

  // 이미지를 최대 1280px로 리사이즈 후 JPEG 압축 (Vercel 4.5MB 제한 대응)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1280;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("이미지 압축 실패")),
          "image/jpeg",
          0.85
        );
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSavedIds(new Set());

    try {
      const compressed = await compressImage(selectedFile);

      const formData = new FormData();
      formData.append("image", compressed, "image.jpg");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      // JSON이 아닌 응답(413 등) 처리
      const text = await res.text();
      let data: { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        if (res.status === 413) {
          throw new Error("이미지 크기가 너무 큽니다. 더 작은 사진을 사용해주세요.");
        }
        throw new Error("서버 오류가 발생했습니다. 다시 시도해주세요.");
      }

      if (!res.ok) {
        throw new Error(data.error || "분석 실패");
      }

      const items = Array.isArray(data) ? data as NutritionData[] : [data as NutritionData];
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  };

  const saveItem = async (item: NutritionData, idx: number) => {
    if (!session) { setShowLoginModal(true); return; }
    if (savedIds.has(idx)) return;
    const thumbnail = preview ? await createThumbnail(preview) : undefined;
    addRecord(item, thumbnail || undefined, mealType);
    setSavedIds((prev) => new Set(prev).add(idx));
    fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scan" }),
    }).catch(() => {});
  };

  const saveAll = async () => {
    if (!session) { setShowLoginModal(true); return; }
    const thumbnail = preview ? await createThumbnail(preview) : undefined;
    const unsaved = results.filter((_, i) => !savedIds.has(i));
    for (let i = 0; i < results.length; i++) {
      if (!savedIds.has(i)) {
        addRecord(results[i], thumbnail || undefined, mealType);
        setSavedIds((prev) => new Set(prev).add(i));
      }
    }
    if (unsaved.length > 0) {
      fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      }).catch(() => {});
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSelectedFile(null);
    setResults([]);
    setSavedIds(new Set());
    setError(null);
  };

  return (
    <>
    {showLoginModal && (
      <LoginModal onClose={() => setShowLoginModal(false)} />
    )}
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🥗</span>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">푸드스캔</h1>
            <p className="text-xs text-gray-500">AI 음식 영양소 분석기</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* 오늘 칼로리 진행 바 */}
        <CalorieProgress />

        {/* 식사 유형 선택 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">식사 유형</p>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 transition-all text-xs font-semibold ${
                  mealType === type
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-500 hover:border-orange-200"
                }`}
              >
                <span className="text-xl mb-1">{MEAL_TYPE_ICONS[type]}</span>
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 업로드 영역 */}
        {!preview ? (
          <ImageUpload onImageSelect={handleImageSelect} isLoading={isLoading} />
        ) : (
          <div className="space-y-4">
            {/* 미리보기 */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-black aspect-video">
              <Image
                src={preview}
                alt="업로드된 음식 사진"
                fill
                className="object-contain"
              />
              {/* 식사 유형 뱃지 */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <span>{MEAL_TYPE_ICONS[mealType]}</span>
                {MEAL_TYPE_LABELS[mealType]}
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                다시 선택
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-[2] py-3 px-6 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    분석 중...
                  </span>
                ) : (
                  "🔍 영양소 분석하기"
                )}
              </button>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-8 text-center shadow border border-orange-100">
            <div className="text-4xl mb-3 animate-bounce">🤖</div>
            <p className="font-semibold text-gray-700">AI가 음식을 분석하고 있어요</p>
            <p className="text-sm text-gray-400 mt-1">한국 음식 영양소 데이터베이스 참조 중...</p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-semibold text-red-700">{error}</p>
            <p className="text-sm text-red-500 mt-1">사진을 다시 시도하거나 더 선명한 사진을 사용해주세요.</p>
          </div>
        )}

        {/* 결과 카드 (다중) */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* 감지된 음식 수 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                🍽️ 음식 {results.length}가지 감지됨
              </p>
              <span className="text-xs text-gray-400">
                {savedIds.size}/{results.length} 저장됨
              </span>
            </div>

            {/* 개별 카드 */}
            {results.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <NutritionCard data={item} />
                <button
                  onClick={() => saveItem(item, idx)}
                  disabled={savedIds.has(idx)}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition-all ${
                    savedIds.has(idx)
                      ? "bg-green-100 text-green-600 cursor-default"
                      : "bg-gradient-to-r from-orange-400 to-rose-400 text-white hover:opacity-90"
                  }`}
                >
                  {savedIds.has(idx) ? "✓ 저장됨" : `💾 "${item.foodName}" 저장`}
                </button>
              </div>
            ))}

            {/* 하단 버튼 */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
              {results.length > 1 && savedIds.size < results.length && (
                <button
                  onClick={saveAll}
                  className="flex-[2] py-3.5 rounded-xl bg-gray-800 text-white font-bold shadow-md hover:opacity-90 transition-all"
                >
                  📋 전체 저장 ({results.length - savedIds.size}개)
                </button>
              )}
            </div>
          </div>
        )}

        {/* 안내 */}
        {!preview && results.length === 0 && (
          <div className="text-center text-sm text-gray-400 space-y-1">
            <p>김치찌개, 비빔밥, 삼겹살, 떡볶이 등 한국 음식 분석에 최적화</p>
            <p>분석 결과는 AI 추정치로 실제와 다를 수 있습니다</p>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
