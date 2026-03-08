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
} from "../types";

interface AppContextValue {
  history: HistoryRecord[];
  addRecord: (nutrition: NutritionData, imageDataUrl?: string, mealType?: MealType) => void;
  deleteRecord: (id: string) => void;
  toggleFavoriteRecord: (id: string) => void;

  favorites: FavoriteFood[];
  addFavorite: (record: HistoryRecord) => void;
  removeFavorite: (id: string) => void;

  settings: UserSettings;
  updateSettings: (s: UserSettings) => void;
  clearAll: () => void;
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

  const addRecord = useCallback(
    (nutrition: NutritionData, imageDataUrl?: string, mealType?: MealType) => {
      const now = Date.now();
      const record: HistoryRecord = {
        id: now.toString(),
        date: new Date(now).toISOString().slice(0, 10),
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
  }, [setHistory, setFavorites, setSettings]);

  return (
    <AppContext.Provider
      value={{
        history,
        addRecord,
        deleteRecord,
        toggleFavoriteRecord,
        favorites,
        addFavorite,
        removeFavorite,
        settings,
        updateSettings,
        clearAll,
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
