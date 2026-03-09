export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍪",
};

export interface NutritionData {
  foodName: string;
  description: string;
  servingSize: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  ingredients: string[];
  healthScore: number;
  healthComment: string;
  confidence: "high" | "medium" | "low";
}

export interface HistoryRecord {
  id: string;
  date: string;           // "YYYY-MM-DD"
  timestamp: number;
  imageDataUrl?: string;  // base64 썸네일
  nutrition: NutritionData;
  isFavorite: boolean;
  mealType?: MealType;
  leftoverCalories?: number;
}

export interface FavoriteFood {
  id: string;
  name: string;
  servingSize: string;
  nutrition: NutritionData['nutrition'];
  addedAt: number;
}

export interface UserSettings {
  name: string;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  height: number;   // cm
  weight: number;   // kg
  goalSteps: number; // 일일 목표 걸음수
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  goals: { calories: 2000, protein: 60, carbs: 250, fat: 65 },
  height: 170,
  weight: 65,
  goalSteps: 10000,
};

export interface ExerciseRecord {
  date: string;          // "YYYY-MM-DD"
  steps: number;
  caloriesBurned: number;
  updatedAt: number;
}
