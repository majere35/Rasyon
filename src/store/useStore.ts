```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Recipe, SalesTarget, Expense } from '../types';

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      recipes: [],
      salesTargets: [],
      expenses: [],
      daysWorkedInMonth: 26,
      packagingCosts: [],

      addRecipe: (recipe: Recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
      updateRecipe: (id: string, updated: Recipe) => set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ?
