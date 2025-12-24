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

// Title case helper - capitalize first letter of each word (Turkish-safe)
export function toTitleCase(str: string): string {
    return str
        .split(' ')
        .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : '')
        .join(' ');
}

/**
 * Calculate VAT-exclusive (net) price from VAT-inclusive price
 * @param priceIncludingVat - The customer-facing price (KDV Dahil)
 * @param vatRate - VAT rate as decimal (default 0.10 for restaurant sales = 10%)
 * @returns Net price (KDV Hariç)
 */
export function getNetPrice(priceIncludingVat: number, vatRate: number = 0.10): number {
    return priceIncludingVat / (1 + vatRate);
}
