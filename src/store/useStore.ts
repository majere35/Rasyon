import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Recipe, SalesTarget, Expense } from '../types';

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            company: null,
            setCompany: (info) => set({ company: info }),
            isConfigOpen: false,
            toggleConfig: (isOpen) => set({ isConfigOpen: isOpen }),
            theme: 'dark',
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

            user: null,
            setUser: (user) => set({ user }),

            recipes: [],
            salesTargets: [],
            expenses: [],
            daysWorkedInMonth: 26,
            packagingCosts: [],

            // Ingredients Feature Defaults
            rawIngredients: [],
            ingredientCategories: [],

            initializeDefaults: () => set((state) => {
                if (state.expenses.length > 0) return {}; // Don't overwrite if exists

                const defaults: Expense[] = [
                    // General (KDV %20)
                    { id: 'def_1', name: 'Kira', amount: 0, category: 'fixed', group: 'general', vatRate: 0.20 },
                    { id: 'def_2', name: 'Faturalar (Elektrik/Su/İnternet)', amount: 0, category: 'fixed', group: 'general', vatRate: 0.20 },
                    { id: 'def_3', name: 'Muhasebe', amount: 0, category: 'fixed', group: 'general', vatRate: 0.20 },
                    { id: 'def_4', name: 'Pos Yazılım', amount: 0, category: 'fixed', group: 'general', vatRate: 0.20 },
                    { id: 'def_5', name: 'İlaçlama ve Güvenlik', amount: 0, category: 'fixed', group: 'general', vatRate: 0.20 },

                    // Production (Smart Types) - KDV %1 for Food, %20 for others
                    {
                        id: 'def_6', name: 'Gıda Hammadde', amount: 0, category: 'fixed', group: 'production',
                        isAutomated: true, autoType: 'food_cost', vatRate: 0.01
                    },
                    {
                        id: 'def_7', name: 'Ambalaj', amount: 0, category: 'fixed', group: 'production',
                        isAutomated: true, autoType: 'packaging', vatRate: 0.20
                    },
                    {
                        id: 'def_8', name: 'Fire/Zayii', amount: 0, category: 'fixed', group: 'production',
                        isAutomated: true, autoType: 'percentage', autoValue: 1.5, vatRate: 0.01
                    },
                    {
                        id: 'def_9', name: 'Bakım/Onarım', amount: 0, category: 'fixed', group: 'production',
                        isAutomated: true, autoType: 'percentage', autoValue: 1.0, vatRate: 0.20
                    },

                    // Sales (Smart Types) - KDV %20
                    {
                        id: 'def_10', name: 'Online Satış Komisyonları', amount: 0, category: 'fixed', group: 'sales',
                        isAutomated: true, autoType: 'percentage', autoValue: 10, vatRate: 0.20
                    },
                    {
                        id: 'def_11', name: 'Reklam Giderleri', amount: 0, category: 'fixed', group: 'sales',
                        isAutomated: true, autoType: 'percentage', autoValue: 5, vatRate: 0.20
                    },
                    {
                        id: 'def_12', name: 'Kurye Masrafı', amount: 0, category: 'fixed', group: 'sales',
                        isAutomated: true, autoType: 'courier', autoValue: 70, vatRate: 0.20
                    },

                    // Personnel (No VAT usually)
                    { id: 'def_13', name: 'Net Maaş', amount: 0, category: 'fixed', group: 'personnel', vatRate: 0 },
                    { id: 'def_14', name: 'SGK', amount: 0, category: 'fixed', group: 'personnel', vatRate: 0 },
                    { id: 'def_15', name: 'Yol, Yemek ve Yan Haklar', amount: 0, category: 'fixed', group: 'personnel', vatRate: 0.20 },
                ];

                // Initialize Categories if empty
                if (state.ingredientCategories.length === 0) {
                    const defaultCats: any[] = [
                        { id: 'cat_fruit_veg', name: 'Meyve & Sebze', color: 'bg-green-500' },
                        { id: 'cat_meat', name: 'Et & Tavuk', color: 'bg-red-500' },
                        { id: 'cat_dry', name: 'Kuru Gıda', color: 'bg-yellow-500' },
                        { id: 'cat_dairy', name: 'Süt & Kahvaltılık', color: 'bg-blue-500' },
                        { id: 'cat_packaging', name: 'Ambalaj', color: 'bg-zinc-500' },
                    ];
                    return { expenses: defaults, ingredientCategories: defaultCats };
                }

                return { expenses: defaults };
            }),

            addRecipe: (recipe: Recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
            updateRecipe: (id: string, updated: Recipe) => set((state) => ({
                recipes: state.recipes.map((r) => (r.id === id ? updated : r))
            })),
            deleteRecipe: (id: string) => set((state) => ({
                recipes: state.recipes.filter((r) => r.id !== id),
                salesTargets: state.salesTargets.filter((t) => t.recipeId !== id),
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

            addExpense: (expense: Expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
            removeExpense: (id: string) => set((state) => ({
                expenses: state.expenses.filter((e) => e.id !== id)
            })),
            updateExpense: (id: string, updated: Expense) => set((state) => ({
                expenses: state.expenses.map((e) => (e.id === id ? updated : e))
            })),

            setDaysWorked: (days: number) => set({ daysWorkedInMonth: days }),

            // --- Ingredients Actions ---
            addRawIngredient: (ingredient) => set((state) => ({
                rawIngredients: [...state.rawIngredients, ingredient]
            })),

            updateRawIngredient: (id, updated) => set((state) => {
                const newIngredients = state.rawIngredients.map(item =>
                    item.id === id ? updated : item
                );

                // Auto-update linked recipes
                let recipeUpdated = false;
                const newRecipes = state.recipes.map(recipe => {
                    const needsUpdate = recipe.ingredients.some(i => i.rawIngredientId === id);
                    if (!needsUpdate) return recipe;

                    recipeUpdated = true;
                    const newRecipeIngredients = recipe.ingredients.map(ing => {
                        if (ing.rawIngredientId === id) {
                            return { ...ing, price: updated.price, unit: updated.unit };
                        }
                        return ing;
                    });

                    // Calculate new total cost
                    const newTotalCost = newRecipeIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                    // LOGIC CHANGE: Keep calculatedPrice FIXED, update costMultiplier
                    // Old Logic: costMultiplier fixed, calculatedPrice changes (implicitly via UI or simple recalc)
                    // New Logic: calculatedPrice fixed, costMultiplier = calculatedPrice / newTotalCost

                    let newCostMultiplier = recipe.costMultiplier;
                    if (newTotalCost > 0 && recipe.calculatedPrice > 0) {
                        newCostMultiplier = recipe.calculatedPrice / newTotalCost;
                    }

                    return {
                        ...recipe,
                        ingredients: newRecipeIngredients,
                        totalCost: newTotalCost,
                        costMultiplier: newCostMultiplier
                    };
                });

                return {
                    rawIngredients: newIngredients,
                    recipes: recipeUpdated ? newRecipes : state.recipes
                };
            }),

            deleteRawIngredient: (id) => set((state) => ({
                rawIngredients: state.rawIngredients.filter(item => item.id !== id)
            })),

            addIngredientCategory: (category) => set((state) => ({
                ingredientCategories: [...state.ingredientCategories, category]
            })),

            updateIngredientCategory: (id: string, updated: Partial<any>) => set((state) => ({
                ingredientCategories: state.ingredientCategories.map(item =>
                    item.id === id ? { ...item, ...updated } : item
                )
            })),

            deleteIngredientCategory: (id) => set((state) => ({
                ingredientCategories: state.ingredientCategories.filter(item => item.id !== id)
            })),

            bulkDeleteRawIngredients: (ids: string[]) => set((state) => ({
                rawIngredients: state.rawIngredients.filter(item => !ids.includes(item.id))
            })),

            // Helper for Packaging Costs
            addPackagingCost: (cost) => set((state) => ({ packagingCosts: [...state.packagingCosts, cost] })),
            updatePackagingCost: (id, cost) => set((state) => {
                const index = state.packagingCosts.findIndex(p => p.id === id);
                if (index >= 0) {
                    const newCosts = [...state.packagingCosts];
                    newCosts[index] = cost;
                    return { packagingCosts: newCosts };
                } else {
                    return { packagingCosts: [...state.packagingCosts, cost] };
                }
            }),
            removePackagingCost: (id) => set((state) => ({
                packagingCosts: state.packagingCosts.filter(p => p.id !== id)
            })),
        }),
        {
            name: 'resto-app-storage',
            partialize: (state) => ({
                recipes: state.recipes,
                salesTargets: state.salesTargets,
                expenses: state.expenses,
                company: state.company, // Persist company info
                daysWorkedInMonth: state.daysWorkedInMonth,
                packagingCosts: state.packagingCosts,
                rawIngredients: state.rawIngredients,
                ingredientCategories: state.ingredientCategories,
            }),
        }
    )
);
