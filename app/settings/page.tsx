"use client";

import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { UserSettings } from "../types";

export default function SettingsPage() {
  const { settings, updateSettings, clearAll } = useApp();
  const [form, setForm] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (field: string, value: string | number) => {
    if (field === "name") {
      setForm((prev) => ({ ...prev, name: value as string }));
    } else {
      setForm((prev) => ({
        ...prev,
        goals: { ...prev.goals, [field]: Number(value) },
      }));
    }
    setSaved(false);
  };

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAll();
    setConfirmClear(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-extrabold text-gray-900">환경설정</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* 프로필 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">프로필</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
            />
          </div>
        </section>

        {/* 일일 목표 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">일일 영양 목표</h2>
          <div className="space-y-4">
            {[
              { key: "calories", label: "칼로리", unit: "kcal", min: 1000, max: 5000, step: 50 },
              { key: "protein", label: "단백질", unit: "g", min: 10, max: 300, step: 5 },
              { key: "carbs", label: "탄수화물", unit: "g", min: 50, max: 600, step: 10 },
              { key: "fat", label: "지방", unit: "g", min: 10, max: 200, step: 5 },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">{item.label}</label>
                  <span className="text-sm font-bold text-orange-500">
                    {form.goals[item.key as keyof typeof form.goals]} {item.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={form.goals[item.key as keyof typeof form.goals]}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  className="w-full accent-orange-400"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{item.min}{item.unit}</span>
                  <span>{item.max}{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md ${
            saved
              ? "bg-green-400"
              : "bg-gradient-to-r from-orange-400 to-rose-400 hover:opacity-90"
          }`}
        >
          {saved ? "✓ 저장되었습니다" : "설정 저장"}
        </button>

        {/* 데이터 초기화 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <h2 className="text-sm font-semibold text-red-500 mb-2">데이터 관리</h2>
          <p className="text-xs text-gray-500 mb-3">
            모든 기록, 즐겨찾기, 설정을 초기화합니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button
            onClick={handleClearAll}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              confirmClear
                ? "bg-red-500 text-white"
                : "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
            }`}
          >
            {confirmClear ? "⚠️ 한 번 더 클릭하면 초기화됩니다" : "전체 데이터 초기화"}
          </button>
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
