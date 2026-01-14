/**
 * POS View - Sipariş Takip ve Yönetim Ekranı
 * HemenYolda entegrasyonu ile çalışan bağımsız POS modülü
 */

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
    RefreshCw, Settings, ShoppingBag, CheckCircle2, Clock,
    CreditCard, Banknote, Smartphone, X, Plus, Search,
    TrendingUp, AlertCircle,
    Wifi, WifiOff, Link2, Unlink
} from 'lucide-react';
import { usePOSStore, PAYMENT_TYPE_LABELS, getOpenOrders, getClosedOrders, getTotalsByPaymentType, getProductSalesSummary } from '../store/usePOSStore';
import type { POSOrder, PaymentType, ProductMapping } from '../store/usePOSStore';
import type { HemenYoldaSettings } from '../lib/hemenyolda';
import { testConnection, fetchOrders } from '../lib/hemenyolda';
import { useStore } from '../store/useStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { printReceipt } from '../lib/receipt';
import type { Recipe } from '../types';

// Tab types for POS view
type POSTab = 'orders' | 'mapping' | 'reports' | 'settings';

// POS Product Categories
const POS_CATEGORIES = [
    { id: 'tavuk', label: 'Tavuk Burgerler', color: 'bg-orange-500', keywords: ['tavuk', 'chicken'] },
    { id: 'et', label: 'Et Burgerler', color: 'bg-red-500', keywords: ['et', 'beef', 'angus', 'smash'] },
    { id: 'atistirmalik', label: 'Atıştırmalıklar', color: 'bg-yellow-500', keywords: ['patates', 'fries', 'sos ', 'soslar', 'halka'] },
    { id: 'tender', label: 'Tenderslar', color: 'bg-purple-500', keywords: ['tender', 'strip', 'nugget'] },
    { id: 'icecek', label: 'İçecekler', color: 'bg-blue-500', keywords: ['kola', 'fanta', 'sprite', 'su', 'ayran', 'içecek', 'drink'] },
] as const;

// Source colors and icons
const SOURCE_CONFIG = {
    yemeksepeti: { color: 'bg-red-500', label: 'Yemeksepeti', short: 'YS' },
    getir: { color: 'bg-purple-500', label: 'Getir', short: 'GT' },
    trendyol: { color: 'bg-orange-500', label: 'Trendyol', short: 'TY' },
    manual: { color: 'bg-blue-500', label: 'Manuel', short: 'MN' },
};

export function POSView() {
    const [activeTab, setActiveTab] = useState<POSTab>('orders');
    const [showClosedOrders, setShowClosedOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);

    // Store
    const {
        hemenyoldaSettings, setHemenyoldaSettings,
        orders, addOrders, closeOrder, reopenOrder, deleteOrder,
        productMappings, addProductMapping, removeProductMapping,
        setLastSyncTime,
        isSyncing, setIsSyncing,
        addManualOrder
    } = usePOSStore();

    const { recipes } = useStore();

    // Auto-sync effect
    useEffect(() => {
        if (!hemenyoldaSettings?.isConnected || !hemenyoldaSettings?.apiToken) return;

        const syncOrders = async () => {
            setIsSyncing(true);
            const result = await fetchOrders(hemenyoldaSettings.apiToken);
            if (result.success && result.orders.length > 0) {
                addOrders(result.orders);
            }
            setLastSyncTime(new Date().toISOString());
            setIsSyncing(false);
        };

        // Initial sync
        syncOrders();

        // Sync every 15 seconds
        const interval = setInterval(syncOrders, 15000);
        return () => clearInterval(interval);
    }, [hemenyoldaSettings?.isConnected, hemenyoldaSettings?.apiToken, addOrders, setLastSyncTime, setIsSyncing]);

    const openOrders = getOpenOrders(orders);
    const closedOrders = getClosedOrders(orders);

    const handleCloseOrder = (paymentType: PaymentType) => {
        if (selectedOrder) {
            closeOrder(selectedOrder.id, paymentType);
            setShowPaymentModal(false);
            setSelectedOrder(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">POS Kasa</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Sipariş takip ve yönetim
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Connection Status */}
                    <div className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
                        hemenyoldaSettings?.isConnected
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    )}>
                        {hemenyoldaSettings?.isConnected ? (
                            <>
                                <Wifi size={14} />
                                <span>Bağlı</span>
                                {isSyncing && <RefreshCw size={12} className="animate-spin" />}
                            </>
                        ) : (
                            <>
                                <WifiOff size={14} />
                                <span>Bağlı Değil</span>
                            </>
                        )}
                    </div>

                    {/* New Order Button */}
                    <button
                        onClick={() => setShowNewOrderModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={16} />
                        <span className="hidden md:inline">Yeni Sipariş</span>
                    </button>

                    {/* Settings Button */}
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <Settings size={20} className="text-zinc-500" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
                {[
                    { id: 'orders', label: 'Siparişler', icon: ShoppingBag },
                    { id: 'mapping', label: 'Eşleştirme', icon: Link2 },
                    { id: 'reports', label: 'Raporlar', icon: TrendingUp },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as POSTab)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <OrdersTab
                    openOrders={openOrders}
                    closedOrders={closedOrders}
                    showClosed={showClosedOrders}
                    onToggleClosed={() => setShowClosedOrders(!showClosedOrders)}
                    onSelectOrder={(order) => {
                        setSelectedOrder(order);
                        setShowPaymentModal(true);
                    }}
                    onReopenOrder={reopenOrder}
                    onDeleteOrder={deleteOrder}
                />
            )}

            {/* Mapping Tab */}
            {activeTab === 'mapping' && (
                <MappingTab
                    orders={orders}
                    mappings={productMappings}
                    recipes={recipes}
                    onAddMapping={addProductMapping}
                    onRemoveMapping={removeProductMapping}
                />
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <ReportsTab orders={closedOrders} />
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedOrder && (
                <PaymentModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedOrder(null);
                    }}
                    onConfirm={handleCloseOrder}
                />
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <POSSettingsModal
                    settings={hemenyoldaSettings}
                    onSave={setHemenyoldaSettings}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {/* New Order Modal */}
            {showNewOrderModal && (
                <NewOrderModal
                    recipes={recipes}
                    onClose={() => setShowNewOrderModal(false)}
                    onConfirm={(items) => {
                        // Add order to store
                        addManualOrder(items);

                        // Calculate total and print receipt
                        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
                        printReceipt({
                            orderNumber: Date.now(),
                            orderDate: new Date().toISOString(),
                            items: items.map(item => ({
                                name: item.recipeName,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                totalPrice: item.totalPrice,
                            })),
                            totalAmount,
                        });

                        setShowNewOrderModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Orders Tab Component
function OrdersTab({
    openOrders,
    closedOrders,
    showClosed,
    onToggleClosed,
    onSelectOrder,
    onReopenOrder,
    onDeleteOrder
}: {
    openOrders: POSOrder[];
    closedOrders: POSOrder[];
    showClosed: boolean;
    onToggleClosed: () => void;
    onSelectOrder: (order: POSOrder) => void;
    onReopenOrder: (orderId: number) => void;
    onDeleteOrder: (orderId: number) => void;
}) {
    const displayOrders = showClosed ? closedOrders : openOrders;

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => showClosed && onToggleClosed()}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        !showClosed
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    )}
                >
                    <Clock size={16} />
                    Açık ({openOrders.length})
                </button>
                <button
                    onClick={() => !showClosed && onToggleClosed()}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        showClosed
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-2 ring-green-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    )}
                >
                    <CheckCircle2 size={16} />
                    Kapalı ({closedOrders.length})
                </button>
            </div>

            {/* Orders Grid */}
            {displayOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                    <ShoppingBag size={48} strokeWidth={1} />
                    <p className="mt-4 text-lg font-medium">
                        {showClosed ? "Henüz kapatılmış sipariş yok" : "Bekleyen sipariş yok"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onClick={() => !order.isClosed && onSelectOrder(order)}
                            onReopen={() => onReopenOrder(order.id)}
                            onDelete={() => onDeleteOrder(order.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Order Card Component
function OrderCard({ order, onClick, onReopen, onDelete }: { order: POSOrder; onClick: () => void; onReopen: () => void; onDelete: () => void }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const source = SOURCE_CONFIG[order.source];
    const time = new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div
                onClick={onClick}
                className={clsx(
                    "bg-white dark:bg-zinc-900 rounded-xl border p-4 transition-all",
                    order.isClosed
                        ? "border-green-500/30 opacity-75"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:shadow-lg cursor-pointer"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className={clsx("w-2 h-2 rounded-full", source.color)} />
                        <span className="text-xs font-bold text-zinc-500">{source.short}</span>
                        <span className="text-xs text-zinc-400">#{order.id}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{time}</span>
                </div>

                {/* Customer */}
                {order.customerName && (
                    <p className="font-medium text-zinc-900 dark:text-white truncate mb-2">
                        {order.customerName}
                    </p>
                )}

                {/* Products */}
                <div className="space-y-1 mb-3">
                    {order.products.slice(0, 3).map((product, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400 truncate">
                                {product.quantity}x {product.name}
                            </span>
                        </div>
                    ))}
                    {order.products.length > 3 && (
                        <p className="text-xs text-zinc-400">+{order.products.length - 3} ürün daha</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">
                        ₺{order.totalAmount.toFixed(2)}
                    </span>
                    {order.isClosed ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReopen();
                            }}
                            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                        >
                            Geri Aç
                        </button>
                    ) : (
                        <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-600 rounded-full font-medium">
                            Bekliyor
                        </span>
                    )}
                </div>

                {/* Delete Button - Inside Card */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                    }}
                    className="mt-3 w-full py-1.5 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    Siparişi İptal Et
                </button>
            </div>

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Siparişi İptal Et"
                message="Bu siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                onConfirm={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                }}
                onCancel={() => setShowDeleteConfirm(false)}
                type="danger"
            />
        </>
    );
}

// Payment Modal
function PaymentModal({ order, onClose, onConfirm }: {
    order: POSOrder;
    onClose: () => void;
    onConfirm: (paymentType: PaymentType) => void;
}) {
    const [selectedPayment, setSelectedPayment] = useState<PaymentType>(order.paymentType);

    const paymentOptions: { type: PaymentType; icon: typeof CreditCard }[] = [
        { type: 'ys_online', icon: Smartphone },
        { type: 'getir_online', icon: Smartphone },
        { type: 'trendyol_online', icon: Smartphone },
        { type: 'cash', icon: Banknote },
        { type: 'credit_card', icon: CreditCard },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-bold text-lg">Sipariş Kapat</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Order Summary */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-zinc-500">Sipariş #{order.id}</span>
                            <span className="text-2xl font-bold">₺{order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-zinc-400">
                            {order.products.length} ürün
                        </div>
                    </div>

                    {/* Payment Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Ödeme Tipi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentOptions.map(({ type, icon: Icon }) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedPayment(type)}
                                    className={clsx(
                                        "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                                        selectedPayment === type
                                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    )}
                                >
                                    <Icon size={18} />
                                    {PAYMENT_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={() => onConfirm(selectedPayment)}
                        className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-green-500/20"
                    >
                        <CheckCircle2 size={18} className="inline mr-2" />
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}

// Mapping Tab Component
function MappingTab({ orders, mappings, recipes, onAddMapping, onRemoveMapping }: {
    orders: POSOrder[];
    mappings: ProductMapping[];
    recipes: Recipe[];
    onAddMapping: (mapping: { hemenyoldaName: string; recipeId: string; recipeName: string }) => void;
    onRemoveMapping: (id: string) => void;
}) {
    const [searchTerm, setSearchTerm] = useState('');

    // Get unique product names from orders
    const allProductNames = new Set<string>();
    orders.forEach(order => {
        order.products.forEach(product => {
            allProductNames.add(product.name);
        });
    });

    const productNames = Array.from(allProductNames).sort();
    const mappedNames = new Set(mappings.map((m: ProductMapping) => m.hemenyoldaName));
    const unmappedNames = productNames.filter(name => !mappedNames.has(name));

    const filteredProducts = searchTerm
        ? productNames.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
        : productNames;

    return (
        <div className="space-y-6">
            {/* Unmapped Warning */}
            {unmappedNames.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertCircle className="text-amber-500" size={20} />
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        <strong>{unmappedNames.length}</strong> ürün henüz eşleştirilmemiş
                    </p>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
            </div>

            {/* Product List */}
            <div className="space-y-2">
                {filteredProducts.map(productName => {
                    const mapping = mappings.find((m: ProductMapping) => m.hemenyoldaName === productName);

                    return (
                        <div
                            key={productName}
                            className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                        >
                            <div className="flex items-center gap-3">
                                {mapping ? (
                                    <Link2 size={16} className="text-green-500" />
                                ) : (
                                    <Unlink size={16} className="text-zinc-400" />
                                )}
                                <span className="font-medium">{productName}</span>
                            </div>

                            {mapping ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-500">→ {mapping.recipeName}</span>
                                    <button
                                        onClick={() => onRemoveMapping(mapping.id)}
                                        className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    className="text-sm px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                                    onChange={(e) => {
                                        const recipe = recipes.find((r: Recipe) => r.id === e.target.value);
                                        if (recipe) {
                                            onAddMapping({
                                                hemenyoldaName: productName,
                                                recipeId: recipe.id,
                                                recipeName: recipe.name,
                                            });
                                        }
                                    }}
                                    value=""
                                >
                                    <option value="">Reçete Seç</option>
                                    {recipes.map((recipe: Recipe) => (
                                        <option key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    );
                })}

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">
                        Henüz sipariş verisi yok. Siparişler geldiğinde ürünler burada görünecek.
                    </div>
                )}
            </div>
        </div>
    );
}

// Reports Tab Component
function ReportsTab({ orders }: { orders: POSOrder[] }) {
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt.split('T')[0];
        switch (dateFilter) {
            case 'today': return orderDate === todayStr;
            case 'week': return orderDate >= weekAgo;
            case 'month': return orderDate >= monthAgo;
            default: return true;
        }
    });

    const paymentTotals = getTotalsByPaymentType(filteredOrders);
    const productSummary = getProductSalesSummary(filteredOrders);
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return (
        <div className="space-y-6">
            {/* Date Filter */}
            <div className="flex gap-2">
                {[
                    { id: 'today', label: 'Bugün' },
                    { id: 'week', label: 'Bu Hafta' },
                    { id: 'month', label: 'Bu Ay' },
                    { id: 'all', label: 'Tümü' },
                ].map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setDateFilter(filter.id as typeof dateFilter)}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            dateFilter === filter.id
                                ? "bg-indigo-500 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-500 mb-1">Toplam Ciro</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">₺{totalRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-500 mb-1">Sipariş Adedi</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{filteredOrders.length}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-500 mb-1">Ortalama Sepet</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                        ₺{filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(0) : 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-500 mb-1">Ürün Çeşidi</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{productSummary.length}</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Payment Breakdown */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <h3 className="font-bold mb-4">Ödeme Dağılımı</h3>
                    <div className="space-y-3">
                        {Object.entries(paymentTotals).map(([type, amount]) => (
                            amount > 0 && (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {PAYMENT_TYPE_LABELS[type as PaymentType]}
                                    </span>
                                    <span className="font-medium">₺{amount.toFixed(0)}</span>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <h3 className="font-bold mb-4">En Çok Satanlar</h3>
                    <div className="space-y-3">
                        {productSummary.slice(0, 5).map((product, i) => (
                            <div key={product.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                        {product.name}
                                    </span>
                                </div>
                                <span className="font-medium text-sm">{product.quantity} adet</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// POS Settings Modal
function POSSettingsModal({ settings, onSave, onClose }: {
    settings: HemenYoldaSettings | null;
    onSave: (settings: HemenYoldaSettings | null) => void;
    onClose: () => void;
}) {
    const [token, setToken] = useState(settings?.apiToken || '');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        const result = await testConnection(token);
        setTestResult(result);
        setTesting(false);

        if (result.success) {
            onSave({
                apiToken: token,
                isConnected: true,
                brandId: result.brandId,
                lastSync: new Date().toISOString(),
            });
        }
    };

    const handleDisconnect = () => {
        onSave(null);
        setToken('');
        setTestResult(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-bold text-lg">HemenYolda Ayarları</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            API Anahtarı
                        </label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="HemenYolda'dan aldığınız anahtar..."
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-xs text-zinc-400 mt-1">
                            HemenYolda panelinde marka adının yanındaki anahtar ikonundan alabilirsiniz.
                        </p>
                    </div>

                    {testResult && (
                        <div className={clsx(
                            "p-3 rounded-lg text-sm",
                            testResult.success
                                ? "bg-green-500/10 text-green-600"
                                : "bg-red-500/10 text-red-600"
                        )}>
                            {testResult.message}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleTest}
                            disabled={!token || testing}
                            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                        >
                            {testing ? (
                                <RefreshCw size={18} className="inline animate-spin mr-2" />
                            ) : (
                                <Wifi size={18} className="inline mr-2" />
                            )}
                            Bağlantıyı Test Et
                        </button>
                        {settings?.isConnected && (
                            <button
                                onClick={handleDisconnect}
                                className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-medium transition-colors"
                            >
                                Bağlantıyı Kes
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}

// New Order Modal - Kategorili Butonlarla
function NewOrderModal({ recipes, onClose, onConfirm }: {
    recipes: Recipe[];
    onClose: () => void;
    onConfirm: (items: { recipeId: string; recipeName: string; quantity: number; unitPrice: number; totalPrice: number }[]) => void;
}) {
    const [items, setItems] = useState<Array<{ recipeId: string; recipeName: string; quantity: number; unitPrice: number }>>([]);
    const [activeCategory, setActiveCategory] = useState<string>(POS_CATEGORIES[0].id);

    // Categorize recipes
    const getRecipeCategory = (recipe: Recipe): string => {
        const name = recipe.name.toLowerCase();
        for (const cat of POS_CATEGORIES) {
            if (cat.keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
                return cat.id;
            }
        }
        return 'atistirmalik'; // Default category
    };

    const categorizedRecipes = recipes.reduce((acc, recipe) => {
        const catId = getRecipeCategory(recipe);
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(recipe);
        return acc;
    }, {} as Record<string, Recipe[]>);

    const addProduct = (recipe: Recipe) => {
        const existingIndex = items.findIndex(item => item.recipeId === recipe.id);
        if (existingIndex >= 0) {
            // Increase quantity if already exists
            setItems(items.map((item, i) =>
                i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setItems([...items, {
                recipeId: recipe.id,
                recipeName: recipe.name,
                quantity: 1,
                unitPrice: recipe.calculatedPrice,
            }]);
        }
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(index);
        } else {
            setItems(items.map((item, i) => i === index ? { ...item, quantity } : item));
        }
    };

    const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-bold text-lg">Yeni Sipariş</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Side - Category Tabs & Products */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-800">
                        {/* Category Tabs */}
                        <div className="flex gap-1 p-2 bg-zinc-50 dark:bg-zinc-800/50 overflow-x-auto">
                            {POS_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                                        activeCategory === cat.id
                                            ? `${cat.color} text-white shadow-md`
                                            : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Product Buttons Grid */}
                        <div className="flex-1 overflow-auto p-3">
                            <div className="grid grid-cols-2 gap-2">
                                {(categorizedRecipes[activeCategory] || []).map((recipe: Recipe) => (
                                    <button
                                        key={recipe.id}
                                        onClick={() => addProduct(recipe)}
                                        className="text-left p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95"
                                    >
                                        <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                                            {recipe.name}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1">
                                            ₺{recipe.calculatedPrice.toFixed(0)}
                                        </div>
                                    </button>
                                ))}
                                {(!categorizedRecipes[activeCategory] || categorizedRecipes[activeCategory].length === 0) && (
                                    <div className="col-span-2 text-center py-8 text-zinc-400 text-sm">
                                        Bu kategoride ürün yok
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Order Items */}
                    <div className="w-64 flex flex-col bg-zinc-50 dark:bg-zinc-800/30">
                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                            <h4 className="font-bold text-sm text-zinc-600 dark:text-zinc-400">Sipariş Özeti</h4>
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-1">
                            {items.length === 0 ? (
                                <div className="text-center py-8 text-zinc-400 text-xs">
                                    Ürün eklemek için sola tıklayın
                                </div>
                            ) : (
                                items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-800 rounded-lg text-sm">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate text-xs">{item.recipeName}</div>
                                            <div className="text-xs text-zinc-400">₺{(item.unitPrice * item.quantity).toFixed(0)}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                                className="w-6 h-6 bg-zinc-100 dark:bg-zinc-700 rounded text-xs"
                                            >-</button>
                                            <span className="w-5 text-center text-xs">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                                className="w-6 h-6 bg-zinc-100 dark:bg-zinc-700 rounded text-xs"
                                            >+</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-sm">Toplam</span>
                                <span className="text-xl font-bold">₺{total.toFixed(0)}</span>
                            </div>
                            <button
                                onClick={() => {
                                    onConfirm(
                                        items.map(item => ({ ...item, totalPrice: item.unitPrice * item.quantity }))
                                    );
                                }}
                                disabled={items.length === 0}
                                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                Siparişi Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
