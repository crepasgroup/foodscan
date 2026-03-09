"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { getLocalDateStr } from "../hooks/useDailyStats";

export default function ExercisePage() {
  const { settings, updateExercise, getExerciseByDate } = useApp();
  const weight = settings.weight ?? 65;
  const goalSteps = settings.goalSteps ?? 10000;

  const today = getLocalDateStr();
  const todayRecord = getExerciseByDate(today);

  const [steps, setSteps] = useState<number>(todayRecord?.steps || 0);
  const [isTracking, setIsTracking] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);

  // 걸음 감지용 refs
  const lastAccelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const stepCountRef = useRef<number>(todayRecord?.steps || 0);
  const isTrackingRef = useRef(false);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // steps 상태를 todayRecord와 동기화
  useEffect(() => {
    const s = todayRecord?.steps || 0;
    setSteps(s);
    stepCountRef.current = s;
  }, [todayRecord]);

  const caloriesBurned = Math.round(steps * weight * 0.0005);
  const progressPct = Math.min((steps / goalSteps) * 100, 100);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!isTrackingRef.current) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const prev = lastAccelRef.current;
      if (prev) {
        const delta = Math.abs(
          magnitude - Math.sqrt(prev.x * prev.x + prev.y * prev.y + prev.z * prev.z)
        );
        if (delta > 2.5) {
          stepCountRef.current += 1;
          setSteps(stepCountRef.current);
          updateExercise(today, stepCountRef.current, weight);
        }
      }
      lastAccelRef.current = { x, y, z };
    },
    [today, weight, updateExercise]
  );

  const startTracking = useCallback(async () => {
    // iOS 13+ permission
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (DeviceMotionEvent as any).requestPermission();
        if (result !== "granted") {
          setPermissionDenied(true);
          return;
        }
      } catch {
        setPermissionDenied(true);
        return;
      }
    }

    if (typeof DeviceMotionEvent === "undefined") {
      setSensorAvailable(false);
      return;
    }

    isTrackingRef.current = true;
    setIsTracking(true);
    listenerRef.current = handleMotion;
    window.addEventListener("devicemotion", handleMotion);
  }, [handleMotion]);

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
    setIsTracking(false);
    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  // 페이지 진입 시 자동으로 측정 시작
  useEffect(() => {
    startTracking();
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("devicemotion", listenerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSave = () => {
    const val = parseInt(manualInput);
    if (isNaN(val) || val < 0) return;
    stepCountRef.current = val;
    setSteps(val);
    updateExercise(today, val, weight);
    setManualInput("");
    setShowManual(false);
  };

  const handleReset = () => {
    stopTracking();
    stepCountRef.current = 0;
    setSteps(0);
    updateExercise(today, 0, weight);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-extrabold text-gray-900">운동 만보기</h1>
          <p className="text-xs text-gray-500">오늘 목표: {goalSteps.toLocaleString()} 걸음</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* 걸음수 메인 카드 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-1">오늘 걸음수</p>
          <p className="text-6xl font-extrabold text-blue-500 mb-1">
            {steps.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">걸음</p>

          {/* 진행 바 */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0</span>
              <span className="font-semibold text-blue-500">
                {progressPct.toFixed(1)}%
              </span>
              <span>{goalSteps.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* 칼로리 소모 */}
          <div className="mt-4 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{caloriesBurned}</p>
              <p className="text-xs text-gray-400">소모 칼로리 (kcal)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{weight}</p>
              <p className="text-xs text-gray-400">몸무게 (kg)</p>
            </div>
          </div>
        </section>

        {/* 목표 달성 메시지 */}
        {steps >= goalSteps && (
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl p-4 text-center text-white shadow-md">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold">오늘 목표 달성!</p>
            <p className="text-sm opacity-90">대단해요! 목표 {goalSteps.toLocaleString()} 걸음을 달성했습니다</p>
          </div>
        )}

        {/* 컨트롤 버튼 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          {permissionDenied && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-xs text-red-600">
                동작 센서 접근이 거부되었습니다. 수동 입력을 사용해주세요.
              </p>
            </div>
          )}
          {!sensorAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-xs text-yellow-700">
                이 기기에서는 자동 감지가 지원되지 않습니다. 수동 입력을 사용해주세요.
              </p>
            </div>
          )}

          {sensorAvailable && !permissionDenied && (
            <>
              {isTracking ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-green-500 font-semibold">자동 감지 중...</span>
                  </div>
                  <button
                    onClick={stopTracking}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-red-500 border-2 border-red-200 hover:bg-red-50 transition-colors"
                  >
                    ⏹ 측정 중단
                  </button>
                </div>
              ) : (
                <button
                  onClick={startTracking}
                  className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-400 to-cyan-400 hover:opacity-90 transition-all shadow-md"
                >
                  ▶ 측정 재시작
                </button>
              )}
            </>
          )}

          {/* 수동 입력 */}
          <button
            onClick={() => setShowManual((v) => !v)}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            ✏️ 수동 입력
          </button>

          {showManual && (
            <div className="flex gap-2">
              <input
                type="number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="걸음수 입력"
                min={0}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
              <button
                onClick={handleManualSave}
                className="px-4 py-2.5 rounded-xl bg-blue-400 text-white font-semibold text-sm hover:bg-blue-500 transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => { setShowManual(false); setManualInput(""); }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          )}

          {/* 초기화 */}
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            오늘 기록 초기화
          </button>
        </section>

        {/* 안내 */}
        <section className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="text-xs font-semibold text-blue-600 mb-2">사용 안내</h3>
          <ul className="text-xs text-blue-500 space-y-1">
            <li>• 스마트폰을 들고 걸으면 자동으로 걸음수가 측정됩니다</li>
            <li>• iOS에서는 동작 센서 권한이 필요합니다</li>
            <li>• 소모 칼로리 = 걸음수 × 몸무게(kg) × 0.0005</li>
            <li>• 설정 페이지에서 몸무게를 정확히 입력하면 더 정확합니다</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
