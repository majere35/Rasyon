// Central Application Configuration
// This file contains configurable values that can be adjusted without code changes

export const appConfig = {
    // Tax Rates
    vat: {
        standard: 20,
        reduced: 10,
        superReduced: 1,
        zero: 0,
        availableRates: [0, 1, 10, 20] as const,
    },

    // Online Sales Commission
    onlineCommission: {
        defaultRate: 10, // Default 10%
    },

    // Revenue VAT Rate (for food service)
    revenueVat: {
        rate: 10, // 10% VAT on revenue
    },

    // Commission VAT Rate
    commissionVat: {
        rate: 20, // 20% VAT on commission fees
    },
} as const;

export type AppConfig = typeof appConfig;
