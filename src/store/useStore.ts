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
                recipes: state.recipes.map((r) => (r.id === id ? updated : r))
            })),
            deleteRecipe: (id: string) => set((state) => ({
                recipes: state.recipes.filter((r) => r.id !== id)
            })),

            addSalesTarget: (target: SalesTarget) => set((state) => ({
                salesTargets: [...state.salesTargets, target]
            })),
            updateSalesTarget: (id: string, updated: SalesTarget) => set((state) => ({
                salesTargets: state.salesTargets.map((t) => (t.id === id ? updated : t))
            })),
            removeSalesTarget: (id: string) => set((state) => ({
                salesTargets: state.salesTargets.filter((t) => t.id !== id)
            })),

            addPackagingCost: (cost: Expense) => set((state) => ({
                packagingCosts: [...state.packagingCosts, cost]
            })),
            removePackagingCost: (id: string) => set((state) => ({
                packagingCosts: state.packagingCosts.filter((c) => c.id !== id)
            })),

            addExpense: (expense: Expense) => set((state) => ({
                expenses: [...state.expenses, expense]
            })),
            removeExpense: (id: string) => set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id)
            })),

            setDaysWorked: (days: number) => set({ daysWorkedInMonth: days }),
        }),
        {
            name: 'resto-app-storage',
        }
    )
);
