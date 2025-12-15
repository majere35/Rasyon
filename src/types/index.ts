export interface Ingredient {
    id: string;
    name: string;
    quantity: number;
    unit: 'kg' | 'lt' | 'adet' | 'gr' | 'cl';
    price: number;
}

export interface Recipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    totalCost: number;
    costMultiplier: number;
    calculatedPrice: number;
    image?: string;
}

export interface SalesTarget {
    id: string;
    recipeId: string;
    dailyTarget: number;
    packageDailyTarget?: number; // New field for Package Quantity
}

export interface Expense {
    id: string;
    name: string;
    amount: number;
    category: 'fixed' | 'variable';
    group?: 'general' | 'production' | 'sales' | 'personnel'; // Strict union now

    // v0.5 Smart Expense Fields
    isAutomated?: boolean;
    autoType?: 'food_cost' | 'packaging' | 'percentage' | 'courier' | 'manual';
    autoValue?: number; // Stores %, ratio, or count
    vatRate?: number; // 0.20, 0.01 etc.
    taxMethod?: 'kdv' | 'stopaj'; // For Rent: 'kdv' (20% VAT) or 'stopaj' (20% Withholding on Gross)
}

export interface CompanyInfo {
    name: string;
    officialName: string;
    ownerName: string; // İşletme Yetkilisi
    type: 'limited' | 'sahis';
}

export interface AppState {
    company: CompanyInfo | null;
    setCompany: (info: CompanyInfo) => void;
    isConfigOpen: boolean;
    toggleConfig: (isOpen: boolean) => void;

    theme: 'dark' | 'light';
    toggleTheme: () => void;

    user: any | null; // Using any for Firebase User to avoid complex type deps for now
    setUser: (user: any | null) => void;

    recipes: Recipe[];
    salesTargets: SalesTarget[];
    expenses: Expense[];
    daysWorkedInMonth: number;
    packagingCosts: Expense[];

    addRecipe: (recipe: Recipe) => void;
    updateRecipe: (id: string, updated: Recipe) => void;
    deleteRecipe: (id: string) => void;

    addSalesTarget: (target: SalesTarget) => void;
    updateSalesTarget: (id: string, updated: SalesTarget) => void;
    removeSalesTarget: (id: string) => void;

    addPackagingCost: (cost: Expense) => void;
    updatePackagingCost: (id: string, cost: Expense) => void;
    removePackagingCost: (id: string) => void;

    addExpense: (expense: Expense) => void;
    updateExpense: (id: string, expense: Expense) => void;
    removeExpense: (id: string) => void;

    setDaysWorked: (days: number) => void;
    initializeDefaults: () => void;
}
