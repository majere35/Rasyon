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
    // VAT Rate for tax calculations
    vatRate?: number; // KDV oranı: 0.01 (%1), 0.10 (%10), 0.20 (%20) - Default: 0.01 (Gıda)
}

export interface Recipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    totalCost: number;
    costMultiplier: number;
    calculatedPrice: number;
    image?: string;
    categoryId?: string;
}

export interface IntermediateProduct {
    id: string;
    name: string;
    ingredients: Ingredient[];
    totalCost: number;
    productionQuantity: number;
    productionUnit: 'kg' | 'lt' | 'adet';
    costPerUnit: number;
    portionWeight?: number; // Weight/Volume of a single portion (in grams or ml)
    portionUnit?: 'gr' | 'cl'; // Unit of the portion weight
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
    setIngredientCategories: (categories: IngredientCategory[]) => void;

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

    // Recipe Categories
    recipeCategories: IngredientCategory[];
    addRecipeCategory: (category: IngredientCategory) => void;
    updateRecipeCategory: (id: string, updated: Partial<IngredientCategory>) => void;
    deleteRecipeCategory: (id: string) => void;
    setRecipeCategories: (categories: IngredientCategory[]) => void;

    // Monthly Accounting (Local Only Mode)
    monthlyClosings: MonthlyMonthData[]; // All monthly data stored locally
    saveMonthlyData: (data: MonthlyMonthData) => void;
    deleteMonthlyData: (monthStr: string) => void;

    // Market Analysis
    marketPrices: MarketPriceEntry[];
    addMarketPrice: (entry: MarketPriceEntry) => void;
    updateMarketPrice: (id: string, updated: MarketPriceEntry) => void;
    deleteMarketPrice: (id: string) => void;

    // Cari Takip (Supplier Account Tracking)
    suppliers: Supplier[];
    supplierOrderSlips: SupplierOrderSlip[];
    supplierInvoices: SupplierInvoice[];
    supplierPayments: SupplierPayment[];
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (id: string, supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;
    addSupplierOrderSlip: (slip: SupplierOrderSlip) => void;
    updateSupplierOrderSlip: (id: string, slip: SupplierOrderSlip) => void;
    deleteSupplierOrderSlip: (id: string) => void;
    addSupplierInvoice: (invoice: SupplierInvoice) => void;
    updateSupplierInvoice: (id: string, invoice: SupplierInvoice) => void;
    deleteSupplierInvoice: (id: string) => void;
    addSupplierPayment: (payment: SupplierPayment) => void;
    updateSupplierPayment: (id: string, payment: SupplierPayment) => void;
    deleteSupplierPayment: (id: string) => void;
    convertOrderSlipsToInvoice: (slipIds: string[], invoice: SupplierInvoice) => void;
}

// Multi-VAT breakdown entry for invoices with mixed VAT rates
export interface VatEntry {
    rate: number;     // 0, 1, 10, 20
    amount: number;   // Base amount for this rate
    category: string; // Expense category for this line item
}

export interface Invoice {
    id: string;
    date: string; // ISO date string YYYY-MM-DD
    supplier: string;
    description: string;
    category: string; // e.g. "Gıda", "Ambalaj", "Enerji", "Vergi/Stopaj", "Diğer"
    amount: number;
    taxRate: number; // 0, 1, 10, 20 etc. - Used for simple mode
    status: 'paid' | 'pending';
    paymentDate?: string;
    taxMethod?: 'kdv' | 'stopaj'; // For Rent: 'kdv' (20% VAT) or 'stopaj' (20% Withholding on Gross)
    vatBreakdown?: VatEntry[]; // Optional: For invoices with multiple VAT rates
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

// Market Analysis - Competitor Price Tracking
export interface MarketPriceEntry {
    id: string;
    competitorName: string;     // "Burger King" - autocomplete from existing entries
    productName: string;        // "Whopper"
    price: number;              // 195
    includesFries: boolean;
    includesDrink: boolean;
    includesSauce: boolean;
    includesOther?: string;     // Additional items included
    matchedRecipeId?: string;   // Link to our recipe for comparison
}

// ============================================
// Cari Takip (Supplier Account Tracking) Module
// ============================================

// Tedarikçi (Supplier)
export interface Supplier {
    id: string;
    name: string;                    // "Defne Gıda"
    contactPerson?: string;          // İletişim kişisi
    phone?: string;
    email?: string;
    address?: string;
    paymentTermDays: number;         // Vade süresi (örn: 30 gün)
    notes?: string;
    createdAt: string;               // ISO date
}

// Sipariş Fişi (Order Slip) - Günlük teslimatlar için
export interface SupplierOrderSlip {
    id: string;
    supplierId: string;
    slipNo: string;                  // Fiş numarası
    date: string;                    // Fiş tarihi (ISO)
    items: SupplierInvoiceItem[];    // Fiş kalemleri
    totalAmount: number;             // Toplam tutar
    invoiceId?: string;              // Faturalaştırıldıysa bağlı fatura
    status: 'pending' | 'invoiced';  // Faturalaştırılmış mı?
    notes?: string;
}

// Tedarikçi Faturası
export interface SupplierInvoice {
    id: string;
    supplierId: string;
    invoiceNo: string;               // Fatura numarası
    date: string;                    // Fatura tarihi (ISO)
    dueDate: string;                 // Vade tarihi (otomatik hesaplanır)
    items: SupplierInvoiceItem[];    // Doğrudan fatura kalemleri
    linkedOrderSlipIds: string[];    // Bağlı sipariş fişleri
    totalAmount: number;             // Toplam tutar
    paidAmount: number;              // Ödenen tutar
    status: 'pending' | 'partial' | 'paid';
    notes?: string;
}

// Fatura/Fiş Kalemi (Hammadde bağlantılı)
export interface SupplierInvoiceItem {
    id: string;
    rawIngredientId: string;         // Hammadde referansı
    name: string;                    // Hammadde adı (snapshot)
    quantity: number;                // Miktar
    unitType: 'adet' | 'kutu' | 'koli' | 'kg' | 'lt' | 'paket'; // Miktar cinsi
    unitPrice: number;               // Birim fiyat
    discountPercent: number;         // İskonto yüzdesi
    vatRate: number;                 // KDV oranı (0, 1, 10, 20)
    subtotal: number;                // Ara toplam (quantity * unitPrice)
    discountAmount: number;          // İskonto tutarı
    vatAmount: number;               // KDV tutarı
    totalPrice: number;              // Net toplam (subtotal - discount + vat)
}

// Tedarikçi Ödemesi
export interface SupplierPayment {
    id: string;
    supplierId: string;
    invoiceId?: string;              // İsteğe bağlı fatura bağlantısı
    date: string;                    // Ödeme tarihi
    amount: number;                  // Ödeme tutarı
    method: 'cash' | 'card' | 'eft'; // Ödeme yöntemi
    notes?: string;
}
