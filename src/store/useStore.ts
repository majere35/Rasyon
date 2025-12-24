import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Recipe, SalesTarget, Expense, IntermediateProduct } from '../types';
import { storage } from '../lib/storage';

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

            // Financial Settings
            onlineCommissionRate: 10, // Default 10%
            setOnlineCommissionRate: (rate: number) => set({ onlineCommissionRate: rate }),

            recipes: [],
            salesTargets: [],
            expenses: [],
            daysWorkedInMonth: 26,
            packagingCosts: [],

            // Ingredients Feature Defaults
            rawIngredients: [],
            ingredientCategories: [],
            recipeCategories: [],

            // Intermediate Products Feature
            intermediateProducts: [],

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

                // Initialize Recipe Categories if empty
                if (state.recipeCategories.length === 0) {
                    const defaultRecipeCats: any[] = [
                        { id: 'rcat_burgers', name: 'Burgerler', color: 'bg-orange-500' },
                        { id: 'rcat_sides', name: 'Yan Ürünler', color: 'bg-yellow-500' },
                        { id: 'rcat_drinks', name: 'İçecekler', color: 'bg-blue-500' },
                        { id: 'rcat_other', name: 'Diğer', color: 'bg-zinc-500' },
                    ];
                    return { expenses: defaults, recipeCategories: defaultRecipeCats };
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

            deleteRawIngredient: (id) => set((state) => {
                // Remove from raw ingredients
                const newIngredients = state.rawIngredients.filter(item => item.id !== id);

                // Remove from all recipes that use this ingredient
                const newRecipes = state.recipes.map(recipe => {
                    const filteredIngredients = recipe.ingredients.filter(ing => ing.rawIngredientId !== id);

                    // If no ingredients were removed, return original recipe
                    if (filteredIngredients.length === recipe.ingredients.length) {
                        return recipe;
                    }

                    // Recalculate total cost after removing ingredient
                    const newTotalCost = filteredIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                    // Keep calculatedPrice FIXED, update costMultiplier
                    let newCostMultiplier = recipe.costMultiplier;
                    if (newTotalCost > 0 && recipe.calculatedPrice > 0) {
                        newCostMultiplier = recipe.calculatedPrice / newTotalCost;
                    }

                    return {
                        ...recipe,
                        ingredients: filteredIngredients,
                        totalCost: newTotalCost,
                        costMultiplier: newCostMultiplier
                    };
                });

                return {
                    rawIngredients: newIngredients,
                    recipes: newRecipes
                };
            }),

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
            setIngredientCategories: (categories) => set({ ingredientCategories: categories }),

            bulkDeleteRawIngredients: (ids: string[]) => set((state) => {
                // Remove from raw ingredients
                const newIngredients = state.rawIngredients.filter(item => !ids.includes(item.id));

                // Remove from all recipes that use any of these ingredients
                const newRecipes = state.recipes.map(recipe => {
                    const filteredIngredients = recipe.ingredients.filter(ing =>
                        !ing.rawIngredientId || !ids.includes(ing.rawIngredientId)
                    );

                    // If no ingredients were removed, return original recipe
                    if (filteredIngredients.length === recipe.ingredients.length) {
                        return recipe;
                    }

                    // Recalculate total cost after removing ingredients
                    const newTotalCost = filteredIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                    // Keep calculatedPrice FIXED, update costMultiplier
                    let newCostMultiplier = recipe.costMultiplier;
                    if (newTotalCost > 0 && recipe.calculatedPrice > 0) {
                        newCostMultiplier = recipe.calculatedPrice / newTotalCost;
                    }

                    return {
                        ...recipe,
                        ingredients: filteredIngredients,
                        totalCost: newTotalCost,
                        costMultiplier: newCostMultiplier
                    };
                });

                return {
                    rawIngredients: newIngredients,
                    recipes: newRecipes
                };
            }),

            // --- Intermediate Products Actions ---
            addIntermediateProduct: (product: IntermediateProduct) => set((state) => ({
                intermediateProducts: [...state.intermediateProducts, product]
            })),

            updateIntermediateProduct: (id: string, updated: IntermediateProduct) => set((state) => {
                const newProducts = state.intermediateProducts.map(item =>
                    item.id === id ? updated : item
                );

                // Auto-update linked recipes (similar to rawIngredient logic)
                let recipeUpdated = false;
                const newRecipes = state.recipes.map(recipe => {
                    const needsUpdate = recipe.ingredients.some(i => i.intermediateProductId === id);
                    if (!needsUpdate) return recipe;

                    recipeUpdated = true;
                    const newRecipeIngredients = recipe.ingredients.map(ing => {
                        if (ing.intermediateProductId === id) {
                            // If user already chose 'adet' and we have portionWeight, preserve it and update portion price
                            if (ing.unit === 'adet' && updated.portionWeight && updated.productionUnit !== 'adet') {
                                const factor = updated.portionUnit === 'cl' ? 100 : 1000;
                                const portionPrice = updated.costPerUnit * (updated.portionWeight / factor);
                                return { ...ing, price: portionPrice };
                            }
                            // Otherwise, fall back to default production unit and unit price (kg/lt)
                            return { ...ing, price: updated.costPerUnit, unit: updated.productionUnit };
                        }
                        return ing;
                    });

                    const newTotalCost = newRecipeIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                    // Keep calculatedPrice FIXED, update costMultiplier
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
                    intermediateProducts: newProducts,
                    recipes: recipeUpdated ? newRecipes : state.recipes
                };
            }),

            deleteIntermediateProduct: (id: string) => set((state) => {
                // Remove from all recipes that use this intermediate product
                const newRecipes = state.recipes.map(recipe => {
                    const filteredIngredients = recipe.ingredients.filter(ing => ing.intermediateProductId !== id);

                    // If no ingredients were removed, return original recipe
                    if (filteredIngredients.length === recipe.ingredients.length) {
                        return recipe;
                    }

                    // Recalculate total cost after removing ingredient
                    const newTotalCost = filteredIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                    // Keep calculatedPrice FIXED, update costMultiplier
                    let newCostMultiplier = recipe.costMultiplier;
                    if (newTotalCost > 0 && recipe.calculatedPrice > 0) {
                        newCostMultiplier = recipe.calculatedPrice / newTotalCost;
                    }

                    return {
                        ...recipe,
                        ingredients: filteredIngredients,
                        totalCost: newTotalCost,
                        costMultiplier: newCostMultiplier
                    };
                });

                // Remove from intermediate products that use this intermediate product
                const newIntermediateProducts = state.intermediateProducts.map(product => {
                    if (product.id === id) return product; // Skip the one being deleted

                    const filteredIngredients = product.ingredients.filter(ing => ing.intermediateProductId !== id);

                    // If no ingredients were removed, return original product
                    if (filteredIngredients.length === product.ingredients.length) {
                        return product;
                    }

                    // Recalculate total cost
                    const newTotalCost = filteredIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                    const newCostPerUnit = product.productionQuantity > 0
                        ? newTotalCost / product.productionQuantity
                        : 0;

                    return {
                        ...product,
                        ingredients: filteredIngredients,
                        totalCost: newTotalCost,
                        costPerUnit: newCostPerUnit
                    };
                }).filter(item => item.id !== id); // Final filter to remove deleted product

                return {
                    intermediateProducts: newIntermediateProducts,
                    recipes: newRecipes
                };
            }),

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

            // --- Monthly Accounting Actions ---
            monthlyClosings: [],

            saveMonthlyData: (data: any) => set((state) => {
                // Check if exists
                const index = state.monthlyClosings.findIndex(m => m.monthStr === data.monthStr);
                let newClosings;
                if (index !== -1) {
                    newClosings = [...state.monthlyClosings];
                    newClosings[index] = data;
                } else {
                    newClosings = [...state.monthlyClosings, data];
                }
                return { monthlyClosings: newClosings };
            }),

            deleteMonthlyData: (monthStr: string) => set((state) => ({
                monthlyClosings: state.monthlyClosings.filter(m => m.monthStr !== monthStr)
            })),

            addRecipeCategory: (category) => set((state) => ({
                recipeCategories: [...state.recipeCategories, category]
            })),

            updateRecipeCategory: (id, updated) => set((state) => ({
                recipeCategories: state.recipeCategories.map(item =>
                    item.id === id ? { ...item, ...updated } : item
                )
            })),

            deleteRecipeCategory: (id) => set((state) => ({
                recipeCategories: state.recipeCategories.filter(item => item.id !== id),
                // Optionally clear categoryId from recipes that were in this category
                recipes: state.recipes.map(r => r.categoryId === id ? { ...r, categoryId: undefined } : r)
            })),

            setRecipeCategories: (categories) => set({ recipeCategories: categories }),
        }),
        {
            name: 'resto-app-storage',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({
                recipes: state.recipes,
                salesTargets: state.salesTargets,
                expenses: state.expenses,
                company: state.company, // Persist company info
                daysWorkedInMonth: state.daysWorkedInMonth,
                packagingCosts: state.packagingCosts,
                rawIngredients: state.rawIngredients,
                ingredientCategories: state.ingredientCategories,
                recipeCategories: state.recipeCategories,
                intermediateProducts: state.intermediateProducts,
                monthlyClosings: state.monthlyClosings, // Persist monthly data
                onlineCommissionRate: state.onlineCommissionRate, // Persist commission rate
            }),
        }
    )
);
