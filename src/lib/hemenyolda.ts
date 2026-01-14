/**
 * HemenYolda API Service
 * Handles communication with HemenYolda delivery platform API
 */

// Use proxy in development to bypass CORS, direct URL in production
const BASE_URL = import.meta.env.DEV ? '/api/hemenyolda' : 'https://hemenyolda.com/api/v2';

// Types for HemenYolda API responses
export interface HemenYoldaProduct {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    note?: string;
}

export interface HemenYoldaOrder {
    id: number;
    externalId?: string; // Platform-specific order ID
    createdAt: string;
    source: 'yemeksepeti' | 'getir' | 'trendyol' | 'manual';
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    products: HemenYoldaProduct[];
    totalAmount: number;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentType: 'ys_online' | 'getir_online' | 'trendyol_online' | 'cash' | 'credit_card';
    note?: string;
}

export interface HemenYoldaSettings {
    apiToken: string;
    isConnected: boolean;
    lastSync?: string;
    brandId?: number;
}

// Parse raw API response to our order format
function parseOrder(raw: any): HemenYoldaOrder {
    // Determine source from integration type
    let source: HemenYoldaOrder['source'] = 'manual';
    let paymentType: HemenYoldaOrder['paymentType'] = 'cash';

    const integrationSource = raw.integration_source?.toLowerCase() || raw.source?.toLowerCase() || '';

    if (integrationSource.includes('yemeksepeti') || integrationSource.includes('ys')) {
        source = 'yemeksepeti';
        paymentType = 'ys_online';
    } else if (integrationSource.includes('getir')) {
        source = 'getir';
        paymentType = 'getir_online';
    } else if (integrationSource.includes('trendyol')) {
        source = 'trendyol';
        paymentType = 'trendyol_online';
    }

    // Parse products from order items
    const products: HemenYoldaProduct[] = (raw.order_items || raw.products || []).map((item: any) => ({
        name: item.name || item.product_name || 'Bilinmeyen Ürün',
        quantity: item.quantity || item.count || 1,
        unitPrice: parseFloat(item.unit_price || item.price || 0),
        totalPrice: parseFloat(item.total_price || item.total || 0),
        note: item.note || item.customer_note || undefined,
    }));

    // Parse status
    let status: HemenYoldaOrder['status'] = 'pending';
    const rawStatus = (raw.status || '').toLowerCase();
    if (rawStatus.includes('deliver') || rawStatus.includes('complete')) {
        status = 'delivered';
    } else if (rawStatus.includes('prepar') || rawStatus.includes('accepted')) {
        status = 'preparing';
    } else if (rawStatus.includes('ready')) {
        status = 'ready';
    } else if (rawStatus.includes('cancel')) {
        status = 'cancelled';
    }

    return {
        id: raw.id,
        externalId: raw.external_id || raw.order_id_external || undefined,
        createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
        source,
        status,
        products,
        totalAmount: parseFloat(raw.total_amount || raw.total || raw.grand_total || 0),
        customerName: raw.customer_name || raw.customer?.name || undefined,
        customerPhone: raw.customer_phone || raw.customer?.phone || undefined,
        customerAddress: raw.customer_address || raw.address?.full_address || raw.delivery_address || undefined,
        paymentType,
        note: raw.note || raw.customer_note || raw.order_note || undefined,
    };
}

/**
 * Test API connection with the provided token
 */
export async function testConnection(token: string): Promise<{ success: boolean; message: string; brandId?: number }> {
    try {
        const response = await fetch(`${BASE_URL}/order/orders?per_page=1`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            // Try to extract brand ID from token (it's a JWT)
            let brandId: number | undefined;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                brandId = payload.brand_id;
            } catch {
                // Ignore JWT parsing errors
            }

            return {
                success: true,
                message: 'Bağlantı başarılı!',
                brandId,
            };
        } else if (response.status === 401) {
            return { success: false, message: 'Geçersiz API anahtarı' };
        } else {
            return { success: false, message: `Bağlantı hatası: ${response.status}` };
        }
    } catch (error) {
        return {
            success: false,
            message: `Bağlantı kurulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
        };
    }
}

/**
 * Fetch orders from HemenYolda API
 */
export async function fetchOrders(
    token: string,
    options?: {
        startDate?: string;
        endDate?: string;
        page?: number;
        perPage?: number;
    }
): Promise<{ success: boolean; orders: HemenYoldaOrder[]; error?: string }> {
    try {
        const params = new URLSearchParams();
        params.append('per_page', String(options?.perPage || 50));
        if (options?.page) params.append('page', String(options.page));
        if (options?.startDate) params.append('start_date', options.startDate);
        if (options?.endDate) params.append('end_date', options.endDate);

        const response = await fetch(`${BASE_URL}/order/orders?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return {
                success: false,
                orders: [],
                error: `API hatası: ${response.status}`
            };
        }

        const data = await response.json();

        // Handle different response structures
        const rawOrders = Array.isArray(data) ? data : (data.data || data.orders || []);
        const orders = rawOrders.map(parseOrder);

        return { success: true, orders };
    } catch (error) {
        return {
            success: false,
            orders: [],
            error: error instanceof Error ? error.message : 'Bilinmeyen hata'
        };
    }
}

/**
 * Get unique product names from orders (for mapping)
 */
export function getUniqueProductNames(orders: HemenYoldaOrder[]): string[] {
    const names = new Set<string>();
    orders.forEach(order => {
        order.products.forEach(product => {
            names.add(product.name);
        });
    });
    return Array.from(names).sort();
}
