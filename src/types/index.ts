export interface Ingredient {
    id: string;
    name: string;
    quantity: number;
    unit: 'kg' | 'lt' | 'adet';
    price: number;
}

export interface Recipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    totalCost: number;
    costMultiplier: number;
    calculatedPrice: number;
}

export interface SalesTarget {
    id: string;
    recipeId: string;
    dailyTarget: number;
}

export interface Expense {
    id: string;
    name: string;
    amount: number;
    category: 'fixed' | 'variable';
}

export interface AppState {
    recipes: Recipe[];
    salesTargets: SalesTarget[];
    expenses: Expense[];
    daysWorkedInMonth: number;
    packagingCosts: Expense[];

    addRecipe: (recipe: Recipe) => void;
    updateRecipe: (id: string, recipe: Recipe) => void;
    deleteRecipe: (id: string) => void;

    addSalesTarget: (target: SalesTarget) => void;
    updateSalesTarget: (id: string, target: SalesTarget) => void;
    removeSalesTarget: (id: string) => void;

    addExpense: (expense: Expense) => void;
    removeExpense: (id: string) => void;

    setDaysWorked: (days: number) => void;
}
