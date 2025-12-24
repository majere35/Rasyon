// Tax Calculation Utilities
// Centralized tax calculation logic to avoid code duplication

export interface Company {
    type: 'limited' | 'sahis';
}

/**
 * Calculate income tax based on annual profit and company type
 * @param annualProfit - Annual profit amount
 * @param companyType - Company type ('limited' or 'sahis')
 * @returns Calculated annual tax amount
 */
export function calculateIncomeTax(
    annualProfit: number,
    companyType: 'limited' | 'sahis' = 'sahis'
): number {
    // No tax on losses
    if (annualProfit <= 0) return 0;

    if (companyType === 'limited') {
        // Corporate Tax (Kurumlar Vergisi) - 25% flat rate
        return Math.max(0, annualProfit) * 0.25;
    }

    // Progressive Tax for Sole Proprietorship (Şahıs Şirketi)
    // 2025 Turkish Tax Brackets
    let tax = 0;
    const income = annualProfit;

    if (income <= 158000) {
        tax = income * 0.15;
    } else if (income <= 330000) {
        tax = 23700 + (income - 158000) * 0.20;
    } else if (income <= 800000) {
        tax = 58100 + (income - 330000) * 0.27;
    } else if (income <= 4300000) {
        tax = 185000 + (income - 800000) * 0.35;
    } else {
        tax = 1410000 + (income - 4300000) * 0.40;
    }

    return tax;
}

/**
 * Calculate monthly tax from annual profit
 * @param annualProfit - Annual profit amount
 * @param companyType - Company type ('limited' or 'sahis')
 * @returns Monthly tax amount (annual tax / 12)
 */
export function calculateMonthlyIncomeTax(
    annualProfit: number,
    companyType: 'limited' | 'sahis' = 'sahis'
): number {
    const annualTax = calculateIncomeTax(annualProfit, companyType);
    return annualTax / 12;
}

/**
 * Calculate VAT status including carry-over from previous periods
 * @param incomeVat - VAT calculated on income (sales)
 * @param deductibleVat - Current month's deductible VAT (expenses + commissions)
 * @param carryInVat - VAT carried over from the previous month
 * @returns Object containing payable VAT and carry-out VAT for next month
 */
export function calculateVatStatus(
    incomeVat: number,
    deductibleVat: number,
    carryInVat: number = 0
) {
    const totalInputs = deductibleVat + carryInVat;
    const balance = incomeVat - totalInputs;

    if (balance > 0) {
        return {
            payableVat: balance,
            carryOverToNext: 0
        };
    } else {
        return {
            payableVat: 0,
            carryOverToNext: Math.abs(balance)
        };
    }
}

/**
 * Get the previous month string (YYYY-MM)
 */
export function getPreviousMonthStr(monthStr: string): string {
    const [year, month] = monthStr.split('-').map(Number);
    if (month === 1) {
        return `${year - 1}-12`;
    }
    return `${year}-${String(month - 1).padStart(2, '0')}`;
}

/**
 * Calculate the accumulated VAT carry-over for a target month.
 * This function iterates through all preceding months in the store and calculates the VAT chain.
 */
export function getAvailableVatCarryOver(
    targetMonthStr: string,
    monthlyClosings: any[],
    onlineCommissionRate: number,
    revenueVatRate: number,
    commissionVatRate: number
): number {
    // 1. Sort months chronologically
    const sorted = [...monthlyClosings].sort((a, b) => a.monthStr.localeCompare(b.monthStr));

    let currentCarryOver = 0;

    for (const data of sorted) {
        // Stop if we reached or passed the target month
        if (data.monthStr >= targetMonthStr) break;

        // Calculate this month's status
        const invoices = data.invoices || [];
        const dailySales = data.dailySales || [];

        // 1. Calculate Income VAT
        const totalRevenue = dailySales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
        const incomeVat = totalRevenue * (revenueVatRate / 100);

        // 2. Calculate Deductible VAT
        const totalOnlineSales = dailySales.reduce((sum: number, sale: any) => {
            return sum + (sale.yemeksepeti || 0) + (sale.trendyol || 0) + (sale.getirYemek || 0) + (sale.migrosYemek || 0);
        }, 0);
        const commissionCost = totalOnlineSales * (onlineCommissionRate / 100);
        const commissionVat = commissionCost * (commissionVatRate / 100);

        let totalDeductible = commissionVat;
        invoices.forEach((inv: any) => {
            const category = inv.category || 'diger';
            const amt = inv.amount || 0;
            if (category === 'kira' && inv.taxMethod === 'stopaj') {
                // Stopaj doesn't have deductible VAT
            } else {
                const vat = amt * ((inv.taxRate !== undefined ? inv.taxRate : 20) / 100);
                totalDeductible += vat;
            }
        });

        // 3. Chain the carry-over
        const status = calculateVatStatus(incomeVat, totalDeductible, currentCarryOver);
        currentCarryOver = status.carryOverToNext;
    }

    return currentCarryOver;
}

