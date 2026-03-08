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
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: "",
  goals: { calories: 2000, protein: 60, carbs: 250, fat: 65 },
};
