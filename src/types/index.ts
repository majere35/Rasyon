export interface Ingredient {
    id: string;
    name: string;
    quantity: number;
    unit: 'kg' | 'lt' | 'adet' | 'gr' | 'cl';
    price: number;
    rawIngredientId?: string; // Link to global raw ingredient
    intermediateProductId?: string; // Link to intermediate product (ara ürün)
}

export interface IngredientCategory {
    id: string;
    name: string;
    color: string;
}

export interface RawIngredient {
    id: string;
    name: string;
    categoryId: string;
    price: number; // Unit price (per kg/lt) - CALCULATED from package
    unit: 'kg' | 'lt' | 'adet' | 'gr' | 'cl';
    minimumStock?: number;
    // Package-based pricing
    packageQuantity?: number;   // Package quantity (350, 9, 5 etc.)
    packageUnit?: 'kg' | 'lt' | 'adet' | 'gr' | 'cl';  // Package unit
    packagePrice?: number;      // Package price
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

export interface IntermediateProduct {
    id: string;
    name: string;
    ingredients: Ingredient[];
    totalCost: number;
    productionQuantity: number;
    productionUnit: 'kg' | 'lt' | 'adet';
    costPerUnit: number;
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

    // Financial Settings
    onlineCommissionRate: number; // Default 10 (%)
    setOnlineCommissionRate: (rate: number) => void;

    recipes: Recipe[];
    salesTargets: SalesTarget[];
    expenses: Expense[];
    daysWorkedInMonth: number;
    packagingCosts: Expense[];

    // Ingredients Feature
    rawIngredients: RawIngredient[];
    ingredientCategories: IngredientCategory[];
    addRawIngredient: (ingredient: RawIngredient) => void;
    updateRawIngredient: (id: string, ingredient: RawIngredient) => void;
    deleteRawIngredient: (id: string) => void;
    bulkDeleteRawIngredients: (ids: string[]) => void;
    addIngredientCategory: (category: IngredientCategory) => void;
    updateIngredientCategory: (id: string, updated: Partial<IngredientCategory>) => void;
    deleteIngredientCategory: (id: string) => void;

    // Intermediate Products Feature
    intermediateProducts: IntermediateProduct[];
    addIntermediateProduct: (product: IntermediateProduct) => void;
    updateIntermediateProduct: (id: string, product: IntermediateProduct) => void;
    deleteIntermediateProduct: (id: string) => void;

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

    // Monthly Accounting (Local Only Mode)
    monthlyClosings: MonthlyMonthData[]; // All monthly data stored locally
    saveMonthlyData: (data: MonthlyMonthData) => void;
    deleteMonthlyData: (monthStr: string) => void;
}

export interface Invoice {
    id: string;
    date: string; // ISO date string YYYY-MM-DD
    supplier: string;
    description: string;
    category: string; // e.g. "Gıda", "Ambalaj", "Enerji", "Vergi/Stopaj", "Diğer"
    amount: number;
    taxRate: number; // 0, 1, 10, 20 etc.
    status: 'paid' | 'pending';
    paymentDate?: string;
    taxMethod?: 'kdv' | 'stopaj'; // For Rent: 'kdv' (20% VAT) or 'stopaj' (20% Withholding on Gross)
}

export interface DailySale {
    id: string;
    date: string; // ISO date string YYYY-MM-DD
    cash: number;
    creditCard: number;
    mealCard: number; // Multinet, Sodexo etc.
    // Online Platforms
    yemeksepeti: number;
    trendyol: number;
    getirYemek: number;
    migrosYemek: number;
    online: number; // Legacy or generic online
    totalAmount: number;
    note?: string;
}

export interface MonthlyMonthData {
    id: string; // YYYY-MM format used as ID
    monthStr: string; // "2025-12"
    isClosed: boolean;
    closedAt?: string;
    invoices: Invoice[];
    dailySales: DailySale[];

    // Snapshots of calculated values at closing time
    totalExpenses?: number;
    totalIncome?: number;
    netProfit?: number;
}
