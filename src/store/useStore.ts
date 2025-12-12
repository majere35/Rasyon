import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from '../types';

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            recipes: [],
            salesTargets: [],
            expenses: [],
            daysWorkedInMonth: 26,
            packagingCosts: [],

            addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
            updateRecipe: (id, updated) => set((state) => ({
                recipes: state.recipes.map((r) => (r.id === id ? updated : r))
            })),
            deleteRecipe: (id) => set((state) => ({
                recipes: state.recipes.filter((r) => r.id !== id)
            })),

            addSalesTarget: (target) => set((state) => ({
                salesTargets: [...state.salesTargets, target]
            })),
            updateSalesTarget: (id, updated) => set((state) => ({
                salesTargets: state.salesTargets.map((t) => (t.id === id ? updated : t))
            })),
            removeSalesTarget: (id) => set((state) => ({
                salesTargets: state.salesTargets.filter((t) => t.id !== id)
            })),

            addExpense: (expense) => set((state) => ({
                expenses: [...state.expenses, expense]
            })),
            removeExpense: (id) => set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id)
            })),

            setDaysWorked: (days) => set({ daysWorkedInMonth: days }),
        }),
        {
            name: 'resto-app-storage',
        }
    )
);
