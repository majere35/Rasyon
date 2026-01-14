/**
 * POS Module Store
 * Completely independent from main Rasyon store
 * Handles HemenYolda orders, product mappings, and POS state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../lib/storage';
import type { HemenYoldaOrder, HemenYoldaSettings } from '../lib/hemenyolda';

// Payment types for POS
export type PaymentType = 'ys_online' | 'getir_online' | 'trendyol_online' | 'cash' | 'credit_card';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
    ys_online: 'YS Online',
    getir_online: 'Getir Online',
    trendyol_online: 'Trendyol Online',
    cash: 'Nakit',
    credit_card: 'Kredi Kartı',
};

// POS Order - extends HemenYolda order with local state
export interface POSOrder extends HemenYoldaOrder {
    isClosed: boolean;
    closedAt?: string;
    closedPaymentType?: PaymentType;
}

// Product mapping - HemenYolda product name to Rasyon recipe
export interface ProductMapping {
    id: string;
    hemenyoldaName: string;
    recipeId: string;
    recipeName: string; // Cached for display
}

// Manual order item
export interface ManualOrderItem {
    recipeId: string;
    recipeName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface POSState {
    // Settings
    hemenyoldaSettings: HemenYoldaSettings | null;
    setHemenyoldaSettings: (settings: HemenYoldaSettings | null) => void;

    // Orders
    orders: POSOrder[];
    setOrders: (orders: POSOrder[]) => void;
    addOrders: (orders: HemenYoldaOrder[]) => void;
    closeOrder: (orderId: number, paymentType: PaymentType) => void;
    reopenOrder: (orderId: number) => void;
    deleteOrder: (orderId: number) => void;

    // Product Mappings
    productMappings: ProductMapping[];
    addProductMapping: (mapping: Omit<ProductMapping, 'id'>) => void;
    removeProductMapping: (id: string) => void;
    updateProductMapping: (id: string, recipeId: string, recipeName: string) => void;

    // Sync state
    lastSyncTime: string | null;
    setLastSyncTime: (time: string) => void;
    isSyncing: boolean;
    setIsSyncing: (syncing: boolean) => void;

    // Manual orders
    addManualOrder: (items: ManualOrderItem[]) => void;
}

export const usePOSStore = create<POSState>()(
    persist(
        (set) => ({
            // Settings
            hemenyoldaSettings: null,
            setHemenyoldaSettings: (settings) => set({ hemenyoldaSettings: settings }),

            // Orders
            orders: [],
            setOrders: (orders) => set({
                orders: orders.map(o => ({ ...o, isClosed: false }))
            }),

            addOrders: (newOrders) => set((state) => {
                const existingIds = new Set(state.orders.map(o => o.id));
                const uniqueNewOrders = newOrders
                    .filter(o => !existingIds.has(o.id))
                    .map(o => ({ ...o, isClosed: false } as POSOrder));

                return { orders: [...uniqueNewOrders, ...state.orders] };
            }),

            closeOrder: (orderId, paymentType) => set((state) => ({
                orders: state.orders.map(o =>
                    o.id === orderId
                        ? { ...o, isClosed: true, closedAt: new Date().toISOString(), closedPaymentType: paymentType }
                        : o
                )
            })),

            reopenOrder: (orderId) => set((state) => ({
                orders: state.orders.map(o =>
                    o.id === orderId
                        ? { ...o, isClosed: false, closedAt: undefined, closedPaymentType: undefined }
                        : o
                )
            })),

            deleteOrder: (orderId) => set((state) => ({
                orders: state.orders.filter(o => o.id !== orderId)
            })),

            // Product Mappings
            productMappings: [],

            addProductMapping: (mapping) => set((state) => ({
                productMappings: [
                    ...state.productMappings,
                    { ...mapping, id: crypto.randomUUID() }
                ]
            })),

            removeProductMapping: (id) => set((state) => ({
                productMappings: state.productMappings.filter(m => m.id !== id)
            })),

            updateProductMapping: (id, recipeId, recipeName) => set((state) => ({
                productMappings: state.productMappings.map(m =>
                    m.id === id ? { ...m, recipeId, recipeName } : m
                )
            })),

            // Sync state
            lastSyncTime: null,
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
            isSyncing: false,
            setIsSyncing: (syncing) => set({ isSyncing: syncing }),

            // Manual orders
            addManualOrder: (items) => set((state) => {
                const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
                const manualOrder: POSOrder = {
                    id: Date.now(), // Use timestamp as unique ID for manual orders
                    createdAt: new Date().toISOString(),
                    source: 'manual',
                    status: 'pending',
                    products: items.map(item => ({
                        name: item.recipeName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                    totalAmount,
                    paymentType: 'cash', // Default, will be set when closing
                    isClosed: false, // Create as OPEN
                };

                return { orders: [manualOrder, ...state.orders] };
            }),
        }),
        {
            name: 'rasyon-pos-storage',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({
                hemenyoldaSettings: state.hemenyoldaSettings,
                orders: state.orders,
                productMappings: state.productMappings,
                lastSyncTime: state.lastSyncTime,
            }),
        }
    )
);

// Helper: Get open orders
export function getOpenOrders(orders: POSOrder[]): POSOrder[] {
    return orders.filter(o => !o.isClosed);
}

// Helper: Get closed orders
export function getClosedOrders(orders: POSOrder[]): POSOrder[] {
    return orders.filter(o => o.isClosed);
}

// Helper: Get orders by date
export function getOrdersByDate(orders: POSOrder[], date: string): POSOrder[] {
    return orders.filter(o => o.createdAt.startsWith(date));
}

// Helper: Calculate totals by payment type
export function getTotalsByPaymentType(orders: POSOrder[]): Record<PaymentType, number> {
    const totals: Record<PaymentType, number> = {
        ys_online: 0,
        getir_online: 0,
        trendyol_online: 0,
        cash: 0,
        credit_card: 0,
    };

    orders.filter(o => o.isClosed).forEach(order => {
        const paymentType = order.closedPaymentType || order.paymentType;
        totals[paymentType] += order.totalAmount;
    });

    return totals;
}

// Helper: Get product sales summary
export function getProductSalesSummary(orders: POSOrder[]): Array<{ name: string; quantity: number; total: number }> {
    const summary: Record<string, { quantity: number; total: number }> = {};

    orders.filter(o => o.isClosed).forEach(order => {
        order.products.forEach(product => {
            if (!summary[product.name]) {
                summary[product.name] = { quantity: 0, total: 0 };
            }
            summary[product.name].quantity += product.quantity;
            summary[product.name].total += product.totalPrice;
        });
    });

    return Object.entries(summary)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity);
}
