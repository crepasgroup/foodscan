"use client";

import { useState } from "react";
import { NutritionData, HistoryRecord } from "../types";
import { useApp } from "../context/AppContext";

interface NutritionCardProps {
  data: NutritionData;
  record?: HistoryRecord;
}

const confidenceLabel = {
  high: { text: "높음", color: "bg-green-100 text-green-700" },
  medium: { text: "보통", color: "bg-yellow-100 text-yellow-700" },
  low: { text: "낮음", color: "bg-red-100 text-red-700" },
};

const healthScoreColor = (score: number) => {
  if (score >= 8) return "text-green-600";
  if (score >= 5) return "text-yellow-600";
  return "text-red-600";
};

interface NutrientBarProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
}

function NutrientBar({ label, value, unit, max, color }: NutrientBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          {value}
          <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NutritionCard({ data, record }: NutritionCardProps) {
  const { nutrition, confidence } = data;
  const conf = confidenceLabel[confidence];
  const { favorites, addFavorite, removeFavorite, history } = useApp();

  // record가 없으면 history에서 찾기 (방금 저장된 경우)
  const matchedRecord = record ?? history.find((r) => r.nutrition.foodName === data.foodName && r.nutrition.nutrition.calories === data.nutrition.calories);
  const isFaved = matchedRecord ? favorites.some((f) => f.id === matchedRecord.id) : false;

  const handleFavorite = () => {
    if (!matchedRecord) return;
    if (isFaved) {
      removeFavorite(matchedRecord.id);
    } else {
      addFavorite(matchedRecord);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-400 to-rose-400 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{data.foodName}</h2>
            <p className="text-orange-100 text-sm mt-1">{data.servingSize}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conf.color} bg-white/90`}>
              신뢰도: {conf.text}
            </span>
            {matchedRecord && (
              <button
                onClick={handleFavorite}
                className="text-2xl leading-none hover:scale-110 transition-transform"
                title={isFaved ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {isFaved ? "⭐" : "☆"}
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-orange-50">{data.description}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* 칼로리 메인 */}
        <div className="flex items-center justify-center bg-orange-50 rounded-2xl py-5">
          <div className="text-center">
            <p className="text-sm text-orange-500 font-medium">총 칼로리</p>
            <p className="text-5xl font-extrabold text-orange-600 mt-1">
              {nutrition.calories}
            </p>
            <p className="text-orange-400 text-sm">kcal</p>
          </div>
        </div>

        {/* 3대 영양소 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "단백질", value: nutrition.protein, unit: "g", color: "bg-blue-500" },
            { label: "탄수화물", value: nutrition.carbs, unit: "g", color: "bg-amber-500" },
            { label: "지방", value: nutrition.fat, unit: "g", color: "bg-rose-500" },
          ].map((n) => (
            <div key={n.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className={`w-2 h-2 rounded-full ${n.color} mx-auto mb-1`} />
              <p className="text-xs text-gray-500">{n.label}</p>
              <p className="text-lg font-bold text-gray-800">
                {n.value}
                <span className="text-xs font-normal">{n.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* 상세 영양소 바 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">상세 영양소</h3>
          <NutrientBar label="단백질" value={nutrition.protein} unit="g" max={60} color="bg-blue-500" />
          <NutrientBar label="탄수화물" value={nutrition.carbs} unit="g" max={300} color="bg-amber-500" />
          <NutrientBar label="지방" value={nutrition.fat} unit="g" max={70} color="bg-rose-500" />
          <NutrientBar label="식이섬유" value={nutrition.fiber} unit="g" max={30} color="bg-green-500" />
          <NutrientBar label="나트륨" value={nutrition.sodium} unit="mg" max={2000} color="bg-purple-500" />
        </div>

        {/* 주재료 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">주재료</h3>
          <div className="flex flex-wrap gap-2">
            {data.ingredients.map((ing) => (
              <span key={ing} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* 건강 점수 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
          <div>
            <p className="text-sm text-gray-500">건강 점수</p>
            <p className={`text-3xl font-extrabold ${healthScoreColor(data.healthScore)}`}>
              {data.healthScore}
              <span className="text-base font-normal text-gray-400">/10</span>
            </p>
          </div>
          <div className="flex-1 ml-4">
            <p className="text-sm text-gray-600 italic">"{data.healthComment}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
