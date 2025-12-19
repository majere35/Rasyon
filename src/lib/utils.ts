export function formatCurrency(amount: number): string {
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        return '0,00 ₺';
    }
    try {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.error("Format currency error:", error);
        return '0,00 ₺';
    }
}

export function formatNumber(amount: number): string {
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        return '0';
    }
    try {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        }).format(amount);
    } catch (error) {
        console.error("Format number error:", error);
        return '0';
    }
}
