"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useStorage } from "../hooks/useStorage";
import {
  HistoryRecord,
  FavoriteFood,
  UserSettings,
  DEFAULT_SETTINGS,
  NutritionData,
  MealType,
  ExerciseRecord,
} from "../types";

function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface AppContextValue {
  history: HistoryRecord[];
  addRecord: (nutrition: NutritionData, imageDataUrl?: string, mealType?: MealType) => void;
  deleteRecord: (id: string) => void;
  toggleFavoriteRecord: (id: string) => void;
  updateLeftover: (id: string, leftoverCalories: number | undefined) => void;

  favorites: FavoriteFood[];
  addFavorite: (record: HistoryRecord) => void;
  removeFavorite: (id: string) => void;

  settings: UserSettings;
  updateSettings: (s: UserSettings) => void;
  clearAll: () => void;

  exerciseRecords: ExerciseRecord[];
  updateExercise: (date: string, steps: number, weight: number) => void;
  getExerciseByDate: (date: string) => ExerciseRecord | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useStorage<HistoryRecord[]>(
    "calorie-lens:history",
    []
  );
  const [favorites, setFavorites] = useStorage<FavoriteFood[]>(
    "calorie-lens:favorites",
    []
  );
  const [settings, setSettings] = useStorage<UserSettings>(
    "calorie-lens:settings",
    DEFAULT_SETTINGS
  );
  const [exerciseRecords, setExerciseRecords] = useStorage<ExerciseRecord[]>(
    "calorie-lens:exercise",
    []
  );

  const addRecord = useCallback(
    (nutrition: NutritionData, imageDataUrl?: string, mealType?: MealType) => {
      const now = Date.now();
      const record: HistoryRecord = {
        id: now.toString(),
        date: getLocalDateStr(new Date(now)),
        timestamp: now,
        imageDataUrl,
        nutrition,
        isFavorite: false,
        mealType,
      };
      setHistory((prev) => [record, ...prev]);
    },
    [setHistory]
  );

  const deleteRecord = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((r) => r.id !== id));
    },
    [setHistory]
  );

  const toggleFavoriteRecord = useCallback(
    (id: string) => {
      setHistory((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
        )
      );
    },
    [setHistory]
  );

  const updateLeftover = useCallback(
    (id: string, leftoverCalories: number | undefined) => {
      setHistory((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, leftoverCalories } : r
        )
      );
    },
    [setHistory]
  );

  const addFavorite = useCallback(
    (record: HistoryRecord) => {
      const fav: FavoriteFood = {
        id: record.id,
        name: record.nutrition.foodName,
        servingSize: record.nutrition.servingSize,
        nutrition: record.nutrition.nutrition,
        addedAt: Date.now(),
      };
      setFavorites((prev) => {
        if (prev.some((f) => f.id === fav.id)) return prev;
        return [fav, ...prev];
      });
    },
    [setFavorites]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    },
    [setFavorites]
  );

  const updateSettings = useCallback(
    (s: UserSettings) => {
      setSettings(s);
    },
    [setSettings]
  );

  const clearAll = useCallback(() => {
    setHistory([]);
    setFavorites([]);
    setSettings(DEFAULT_SETTINGS);
    setExerciseRecords([]);
  }, [setHistory, setFavorites, setSettings, setExerciseRecords]);

  const updateExercise = useCallback(
    (date: string, steps: number, weight: number) => {
      const caloriesBurned = Math.round(steps * weight * 0.0005);
      setExerciseRecords((prev) => {
        const existing = prev.find((r) => r.date === date);
        if (existing) {
          return prev.map((r) =>
            r.date === date
              ? { ...r, steps, caloriesBurned, updatedAt: Date.now() }
              : r
          );
        }
        return [
          ...prev,
          { date, steps, caloriesBurned, updatedAt: Date.now() },
        ];
      });
    },
    [setExerciseRecords]
  );

  const getExerciseByDate = useCallback(
    (date: string): ExerciseRecord | undefined => {
      return exerciseRecords.find((r) => r.date === date);
    },
    [exerciseRecords]
  );

  return (
    <AppContext.Provider
      value={{
        history,
        addRecord,
        deleteRecord,
        toggleFavoriteRecord,
        updateLeftover,
        favorites,
        addFavorite,
        removeFavorite,
        settings,
        updateSettings,
        clearAll,
        exerciseRecords,
        updateExercise,
        getExerciseByDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
