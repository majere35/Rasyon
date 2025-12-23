// Merkezi gider kategorisi tanımları
// Gider girişindeki kategoriler doğrudan bilanço gruplarına eşlenir

export interface ExpenseCategory {
    value: string;
    label: string;
    group: 'general' | 'production' | 'sales' | 'personnel';
}

export const expenseCategories: ExpenseCategory[] = [
    // GENEL YÖNETİM
    { value: 'kira', label: 'Kira', group: 'general' },
    { value: 'faturalar', label: 'Faturalar (Elektrik/Su/İnternet)', group: 'general' },
    { value: 'muhasebe', label: 'Muhasebe', group: 'general' },
    { value: 'vergi', label: 'Vergi ve Harçlar', group: 'general' },
    { value: 'pos', label: 'Pos/Yazılım', group: 'general' },
    { value: 'guvenlik', label: 'İlaçlama ve Güvenlik', group: 'general' },

    // ÜRETİM GİDERLERİ
    { value: 'gida', label: 'Gıda Hammadde', group: 'production' },
    { value: 'ambalaj', label: 'Ambalaj', group: 'production' },
    { value: 'fire', label: 'Fire/Zayii', group: 'production' },
    { value: 'bakim', label: 'Bakım/Onarım', group: 'production' },

    // SATIŞ & DAĞITIM
    { value: 'reklam', label: 'Reklam Giderleri', group: 'sales' },
    { value: 'kurye', label: 'Kurye Masrafı', group: 'sales' },

    // PERSONEL
    { value: 'maas', label: 'Net Maaş', group: 'personnel' },
    { value: 'sgk', label: 'SGK', group: 'personnel' },
    { value: 'yan_haklar', label: 'Yol, Yemek ve Yan Haklar', group: 'personnel' },

    // DİĞER
    { value: 'diger', label: 'Diğer', group: 'general' },
];

// Dropdown için options array
export const expenseCategoryOptions = expenseCategories.map(c => ({
    value: c.value,
    label: c.label
}));

// Kategorinin hangi gruba ait olduğunu bul
export const getCategoryGroup = (categoryValue: string): 'general' | 'production' | 'sales' | 'personnel' => {
    const category = expenseCategories.find(c => c.value === categoryValue);
    return category?.group || 'general';
};

// Kategori değerinden label al
export const getCategoryLabel = (categoryValue: string): string => {
    const category = expenseCategories.find(c => c.value === categoryValue);
    return category?.label || categoryValue;
};
