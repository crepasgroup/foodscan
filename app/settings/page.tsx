"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useApp } from "../context/AppContext";
import { UserSettings, DEFAULT_SETTINGS } from "../types";

export default function SettingsPage() {
  const { settings, updateSettings, clearAll } = useApp();
  const { data: session } = useSession();
  const [form, setForm] = useState<UserSettings>({ ...DEFAULT_SETTINGS, ...settings });
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setForm({ ...DEFAULT_SETTINGS, ...settings });
  }, [settings]);

  const handleChange = (field: string, value: string | number) => {
    if (field === "name") {
      setForm((prev) => ({ ...prev, name: value as string }));
    } else if (field === "height" || field === "weight" || field === "goalSteps") {
      setForm((prev) => ({ ...prev, [field]: Number(value) }));
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
        {/* 로그인 사용자 정보 */}
        {session && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-4">계정 정보</h2>
            <div className="flex items-center gap-4">
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt="프로필"
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
              )}
              <div className="flex-1 min-w-0">
                {session.user?.name && (
                  <p className="font-semibold text-gray-900 truncate">{session.user.name}</p>
                )}
                {session.user?.email && (
                  <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                )}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </section>
        )}

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

        {/* 신체 정보 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">신체 정보</h2>
          <div className="space-y-4">
            {/* 키 슬라이더 */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">키</label>
                <span className="text-sm font-bold text-orange-500">{form.height ?? 170} cm</span>
              </div>
              <input
                type="range"
                min={140}
                max={200}
                step={1}
                value={form.height ?? 170}
                onChange={(e) => handleChange("height", e.target.value)}
                className="w-full accent-orange-400"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>140cm</span>
                <span>200cm</span>
              </div>
            </div>
            {/* 몸무게 슬라이더 */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">몸무게</label>
                <span className="text-sm font-bold text-orange-500">{form.weight ?? 65} kg</span>
              </div>
              <input
                type="range"
                min={30}
                max={150}
                step={1}
                value={form.weight ?? 65}
                onChange={(e) => handleChange("weight", e.target.value)}
                className="w-full accent-orange-400"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>30kg</span>
                <span>150kg</span>
              </div>
            </div>
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
