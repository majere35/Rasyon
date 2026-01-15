import { useState, useMemo } from 'react';
import { Plus, Search, ArrowLeft, Edit2, Trash2, FileText, CreditCard, Clock, Download, Receipt, FileCheck2, X, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { NumberInput } from '../components/NumberInput';
import { formatCurrency } from '../lib/utils';
import type { Supplier, SupplierOrderSlip, SupplierInvoice, SupplierPayment, SupplierInvoiceItem, RawIngredient, IngredientCategory } from '../types';

// Date formatter DD/MM/YYYY
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// ============================================
// Main View Component
// ============================================
export function SuppliersView() {
    const {
        suppliers,
        supplierOrderSlips,
        supplierInvoices,
        supplierPayments,
        rawIngredients,
        ingredientCategories,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierOrderSlip,
        deleteSupplierOrderSlip,
        addSupplierInvoice,
        updateSupplierInvoice,
        deleteSupplierInvoice,
        addSupplierPayment,
        deleteSupplierPayment,
        convertOrderSlipsToInvoice,
        addRawIngredient,
    } = useStore();

    // View State
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'supplier' | 'slip' | 'invoice' | 'payment'; id: string } | null>(null);

    // Document Modal State
    const [documentType, setDocumentType] = useState<'slip' | 'invoice'>('slip');

    // UI State for Dashboard
    const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(true);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    // Selected Supplier
    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    // Filtered Suppliers
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Date for payment calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get supplier balance
    const getSupplierBalance = (supplierId: string) => {
        const invoices = supplierInvoices.filter(i => i.supplierId === supplierId);
        const pendingSlips = supplierOrderSlips.filter(s => s.supplierId === supplierId && s.status === 'pending');

        const invoiceDebt = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const slipDebt = pendingSlips.reduce((sum, slip) => sum + slip.totalAmount, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        const totalDebt = invoiceDebt + slipDebt;

        return {
            totalDebt,
            invoiceDebt,
            slipDebt,
            totalPaid,
            remaining: totalDebt - totalPaid
        };
    };

    // Unified pending items (invoices and pending slips) for calculations and calendar
    const allPendingItems = useMemo(() => {
        const unpaidInvoices = supplierInvoices.filter(inv => inv.status !== 'paid');
        const pendingOrderSlips = supplierOrderSlips.filter(slip => slip.status === 'pending');

        return [
            ...unpaidInvoices.map(inv => ({
                ...inv,
                type: 'invoice' as const,
                referenceDate: inv.dueDate,
                amount: inv.totalAmount - inv.paidAmount,
                no: inv.invoiceNo
            })),
            ...pendingOrderSlips.map(slip => {
                const supplier = suppliers.find(s => s.id === slip.supplierId);
                const vade = supplier?.paymentTermDays || 0;
                const d = new Date(slip.date);
                d.setDate(d.getDate() + vade);
                return {
                    ...slip,
                    type: 'slip' as const,
                    referenceDate: d.toISOString().split('T')[0],
                    amount: slip.totalAmount,
                    no: slip.slipNo
                };
            })
        ];
    }, [supplierInvoices, supplierOrderSlips, suppliers]);

    // Handle Delete
    const handleDelete = () => {
        if (!deleteConfirm) return;
        switch (deleteConfirm.type) {
            case 'supplier':
                deleteSupplier(deleteConfirm.id);
                setSelectedSupplierId(null);
                break;
            case 'slip':
                deleteSupplierOrderSlip(deleteConfirm.id);
                break;
            case 'invoice':
                deleteSupplierInvoice(deleteConfirm.id);
                break;
            case 'payment':
                deleteSupplierPayment(deleteConfirm.id);
                break;
        }
        setDeleteConfirm(null);
    };

    // ============================================
    // SUPPLIER LIST VIEW
    // ============================================
    if (!selectedSupplierId) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Cari Takip</h2>
                    <p className="text-zinc-400">Tedarikçi hesaplarınızı, faturaları ve ödemeleri takip edin.</p>
                </div>

                {/* Upcoming Payments Alert */}
                {(() => {
                    // Overdue items (past reference date)
                    const overdueItems = allPendingItems.filter(item => new Date(item.referenceDate) < today);

                    // Upcoming items (due within 60 days)
                    const sixtyDaysLater = new Date(today);
                    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
                    const upcomingItems = allPendingItems
                        .filter(item => {
                            const refDate = new Date(item.referenceDate);
                            return refDate >= today && refDate <= sixtyDaysLater;
                        })
                        .sort((a, b) => new Date(a.referenceDate).getTime() - new Date(b.referenceDate).getTime());

                    if (overdueItems.length === 0 && upcomingItems.length === 0) return null;

                    return (
                        <div className="space-y-4">
                            {/* Summary Header Block (Click to toggle) */}
                            <div
                                onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Clock size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">Ödeme Özeti & Planlama</h3>
                                        <p className="text-zinc-500 text-sm">
                                            {overdueItems.length > 0 ? (
                                                <span className="text-red-400 font-medium">{overdueItems.length} Gecikmiş</span>
                                            ) : (
                                                <span>Gecikmiş ödeme yok</span>
                                            )}
                                            <span className="mx-2 text-zinc-700">|</span>
                                            <span>{upcomingItems.length} Yaklaşan Ödeme</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsCalendarModalOpen(true);
                                        }}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                                        title="Ajanda Görünümü"
                                    >
                                        <Calendar size={18} />
                                        <span className="hidden sm:inline">Ajanda</span>
                                    </button>
                                    <div className="text-zinc-500 group-hover:text-white transition-colors">
                                        {isUpcomingCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                                    </div>
                                </div>
                            </div>

                            {!isUpcomingCollapsed && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Overdue Items */}
                                    {overdueItems.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="text-red-400" size={20} />
                                                <h3 className="font-semibold text-red-400">Vadesi Geçenler ({overdueItems.length})</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {overdueItems.map(item => {
                                                    const supplier = suppliers.find(s => s.id === item.supplierId);
                                                    const daysOverdue = Math.ceil((today.getTime() - new Date(item.referenceDate).getTime()) / (1000 * 60 * 60 * 24));
                                                    return (
                                                        <div key={item.id} className="flex justify-between items-center bg-zinc-900/50 rounded-lg px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-medium">{supplier?.name}</span>
                                                                <span className="text-zinc-500">•</span>
                                                                <span className="text-zinc-400 text-sm">
                                                                    {item.type === 'invoice' ? (item as SupplierInvoice).invoiceNo : (item as SupplierOrderSlip).slipNo}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === 'invoice' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                                    }`}>
                                                                    {item.type === 'invoice' ? 'Fatura' : 'Fiş'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-red-400 text-sm font-medium">
                                                                    {daysOverdue} gün gecikmiş
                                                                </span>
                                                                <span className="font-mono text-white">
                                                                    {item.type === 'invoice'
                                                                        ? formatCurrency((item as SupplierInvoice).totalAmount - (item as SupplierInvoice).paidAmount)
                                                                        : formatCurrency((item as SupplierOrderSlip).totalAmount)
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Upcoming Items */}
                                    {upcomingItems.length > 0 && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="text-amber-400" size={20} />
                                                <h3 className="font-semibold text-amber-400">Yaklaşan Ödemeler ({upcomingItems.length})</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {upcomingItems.map(item => {
                                                    const supplier = suppliers.find(s => s.id === item.supplierId);
                                                    const daysLeft = Math.ceil((new Date(item.referenceDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                    return (
                                                        <div key={item.id} className="flex justify-between items-center bg-zinc-900/50 rounded-lg px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-medium">{supplier?.name}</span>
                                                                <span className="text-zinc-500">•</span>
                                                                <span className="text-zinc-400 text-sm">
                                                                    {item.type === 'invoice' ? (item as SupplierInvoice).invoiceNo : (item as SupplierOrderSlip).slipNo}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.type === 'invoice' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                                    }`}>
                                                                    {item.type === 'invoice' ? 'Fatura' : 'Fiş'}
                                                                </span>
                                                                <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded">
                                                                    {formatDate(item.referenceDate)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`text-sm font-bold ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-green-400'}`}>
                                                                    {daysLeft === 0 ? 'Bugün' : `${daysLeft} gün`}
                                                                </span>
                                                                <span className="font-mono text-white font-bold">
                                                                    {item.type === 'invoice'
                                                                        ? formatCurrency((item as SupplierInvoice).totalAmount - (item as SupplierInvoice).paidAmount)
                                                                        : formatCurrency((item as SupplierOrderSlip).totalAmount)
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Tedarikçi ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingSupplier(null);
                            setIsSupplierModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={16} />
                        Yeni Tedarikçi
                    </button>
                </div>

                {/* Supplier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuppliers.map(supplier => {
                        const balance = getSupplierBalance(supplier.id);
                        const pendingSlips = supplierOrderSlips.filter(s => s.supplierId === supplier.id && s.status === 'pending').length;
                        return (
                            <div
                                key={supplier.id}
                                onClick={() => setSelectedSupplierId(supplier.id)}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-indigo-500/50 hover:bg-zinc-900/80 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{supplier.name}</h3>
                                        <p className="text-zinc-500 text-sm">{supplier.paymentTermDays} gün vade</p>
                                    </div>
                                    {pendingSlips > 0 && (
                                        <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded-full">
                                            {pendingSlips} fiş bekliyor
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                                    <div className="text-sm">
                                        <span className="text-zinc-500">Bakiye: </span>
                                        <span className={`font-mono font-bold ${balance.remaining > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {formatCurrency(balance.remaining)}
                                        </span>
                                    </div>
                                    <ArrowLeft size={16} className="text-zinc-600 group-hover:text-indigo-400 rotate-180 transition-colors" />
                                </div>
                            </div>
                        );
                    })}
                    {filteredSuppliers.length === 0 && (
                        <div className="col-span-full text-center py-12 text-zinc-500">
                            {searchQuery ? 'Tedarikçi bulunamadı.' : 'Henüz tedarikçi eklenmemiş. Yukarıdan yeni tedarikçi ekleyebilirsiniz.'}
                        </div>
                    )}
                </div>

                {/* Supplier Modal */}
                <SupplierModal
                    isOpen={isSupplierModalOpen}
                    onClose={() => setIsSupplierModalOpen(false)}
                    supplier={editingSupplier}
                    onSave={(data) => {
                        if (editingSupplier) {
                            updateSupplier(editingSupplier.id, { ...editingSupplier, ...data });
                        } else {
                            addSupplier({
                                id: crypto.randomUUID(),
                                createdAt: new Date().toISOString(),
                                ...data
                            } as Supplier);
                        }
                        setIsSupplierModalOpen(false);
                    }}
                />

                <ConfirmModal
                    isOpen={!!deleteConfirm}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={handleDelete}
                    title="Silme Onayı"
                    message="Bu öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                />

                {/* Payment Calendar Modal */}
                {isCalendarModalOpen && (
                    <PaymentCalendarModal
                        isOpen={isCalendarModalOpen}
                        onClose={() => setIsCalendarModalOpen(false)}
                        items={allPendingItems.map(it => ({
                            id: it.id,
                            supplierId: it.supplierId,
                            no: it.no,
                            date: it.referenceDate,
                            amount: it.amount,
                            type: it.type
                        }))}
                        suppliers={suppliers}
                    />
                )}
            </div>
        );
    }

    // ============================================
    // SUPPLIER DETAIL VIEW
    // ============================================
    const supplierSlips = supplierOrderSlips.filter(s => s.supplierId === selectedSupplierId);
    const supplierInvoicesList = supplierInvoices.filter(i => i.supplierId === selectedSupplierId);
    const supplierPaymentsList = supplierPayments.filter(p => p.supplierId === selectedSupplierId);
    const balance = getSupplierBalance(selectedSupplierId);

    // Pending slips (not yet invoiced)
    const pendingSlips = supplierSlips.filter(s => s.status === 'pending');

    // Build timeline (invoices + payments sorted by date)
    type TimelineItem =
        | { type: 'invoice'; data: SupplierInvoice; date: string }
        | { type: 'payment'; data: SupplierPayment; date: string }
        | { type: 'slip'; data: SupplierOrderSlip; date: string };

    const timeline: TimelineItem[] = [
        ...supplierInvoicesList.map(inv => ({ type: 'invoice' as const, data: inv, date: inv.date })),
        ...supplierPaymentsList.map(pay => ({ type: 'payment' as const, data: pay, date: pay.date })),
        ...supplierSlips.map(slip => ({ type: 'slip' as const, data: slip, date: slip.date })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Excel Export
    const handleExport = async () => {
        try {
            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Extre');

            // 1. Header Information
            worksheet.mergeCells('A1:G1');
            const titleRow = worksheet.getRow(1);
            titleRow.getCell(1).value = 'HESAP EKSTRESİ';
            titleRow.getCell(1).font = { bold: true, size: 14 };

            worksheet.mergeCells('A2:G2');
            const infoRow = worksheet.getRow(2);
            const dateRange = timeline.length > 0
                ? `(${formatDate(timeline[timeline.length - 1].date)} - ${formatDate(timeline[0].date)})`
                : '';
            infoRow.getCell(1).value = `${selectedSupplier?.name?.toUpperCase()} ${dateRange}`;
            infoRow.getCell(1).font = { bold: true, size: 11 };

            // 2. Define Columns
            const headers = ['Tarih', 'Vade', 'Hareket', 'Açıklama', 'Ödeme', 'Borç', 'Alacak', 'Bakiye'];
            const headerRow = worksheet.getRow(4);
            headerRow.values = headers;

            // Header Styling
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF316254' } // Teal background
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' } // White text
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // 3. Process Data and Calculate Running Balance
            // Timeline is already sorted DESC (newest first). 
            // For running balance calculation, we need ASC (oldest first).
            const sortedTimeline = [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let currentBalance = 0;
            const dataRows = sortedTimeline.map(item => {
                let vade = item.date;
                let hareket = '';
                let aciklama = '';
                let odeme = '';
                let borc = 0;
                let alacak = 0;

                if (item.type === 'invoice') {
                    vade = item.data.dueDate;
                    hareket = 'Alış';
                    aciklama = `Tedarikçiden Alış No:${item.data.invoiceNo}`;
                    alacak = item.data.totalAmount;
                    currentBalance -= alacak;
                } else if (item.type === 'payment') {
                    hareket = 'Ödeme';
                    aciklama = item.data.notes || `${item.data.method.toUpperCase()} Ödemesi`;
                    odeme = item.data.method === 'cash' ? 'Nakit' : item.data.method === 'card' ? 'Kart' : 'EFT';
                    borc = item.data.amount;
                    currentBalance += borc;
                } else if (item.type === 'slip') {
                    // Calculation for slip date + supplier payment terms if needed, but here we use slip date
                    hareket = 'Alış (Fiş)';
                    aciklama = `Sipariş Fişi No:${item.data.slipNo}`;
                    alacak = item.data.totalAmount;
                    currentBalance -= alacak;
                }

                return [
                    formatDate(item.date),
                    formatDate(vade),
                    hareket,
                    aciklama,
                    odeme,
                    borc || '',
                    alacak || '',
                    currentBalance
                ];
            });

            // 4. Add Rows and Apply Cell Styling
            worksheet.addRows(dataRows);

            // Column Widths
            worksheet.columns = [
                { width: 12 }, // Tarih
                { width: 12 }, // Vade
                { width: 12 }, // Hareket
                { width: 45 }, // Açıklama
                { width: 10 }, // Ödeme
                { width: 15 }, // Borç
                { width: 15 }, // Alacak
                { width: 18 }  // Bakiye
            ];

            // Content Styling (Borders and alignment)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 4) {
                    row.eachCell((cell, colNumber) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };

                        // Alignment
                        if ([1, 2, 3, 5].includes(colNumber)) {
                            cell.alignment = { horizontal: 'center' };
                        }

                        // Number formatting for Borç, Alacak, Bakiye
                        if ([6, 7, 8].includes(colNumber)) {
                            cell.numFmt = '#,##0.00 "TL"';
                            cell.alignment = { horizontal: 'right' };
                        }
                    });
                }
            });

            // 5. Generate and Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${selectedSupplier?.name || 'Tedarikçi'}_Ekstre_${new Date().toLocaleDateString('tr-TR')}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Excel dışa aktarma başarısız oldu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSelectedSupplierId(null)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{selectedSupplier?.name}</h2>
                    <p className="text-zinc-500 text-sm">{selectedSupplier?.paymentTermDays} gün vade</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingSupplier(selectedSupplier || null);
                            setIsSupplierModalOpen(true);
                        }}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => setDeleteConfirm({ type: 'supplier', id: selectedSupplierId })}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Balance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                    <div className="text-zinc-500 text-sm mb-1">Toplam Borç</div>
                    <div className="font-mono text-xl font-bold text-red-400">{formatCurrency(balance.totalDebt)}</div>
                    <div className="text-[10px] text-zinc-600 mt-1">
                        Fatura: {formatCurrency(balance.invoiceDebt)} + Fiş: {formatCurrency(balance.slipDebt)}
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                    <div className="text-zinc-500 text-sm mb-1">Ödenen</div>
                    <div className="font-mono text-xl font-bold text-green-400">{formatCurrency(balance.totalPaid)}</div>
                    <div className="text-[10px] text-zinc-600 mt-1 invisible">Placeholder</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                    <div className="text-zinc-500 text-sm mb-1">Kalan Bakiye</div>
                    <div className={`font-mono text-xl font-bold ${balance.remaining > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                        {formatCurrency(balance.remaining)}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">
                        Sipariş fişleri dahil toplam bakiye
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => {
                        setDocumentType('slip');
                        setIsDocumentModalOpen(true);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <FileText size={16} />
                    Sipariş Fişi Ekle
                </button>
                <button
                    onClick={() => {
                        setDocumentType('invoice');
                        setIsDocumentModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Receipt size={16} />
                    Fatura Ekle
                </button>
                <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <CreditCard size={16} />
                    Ödeme Ekle
                </button>
                <button
                    onClick={handleExport}
                    className="ml-auto bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Download size={16} />
                    Extre Oluştur
                </button>
            </div>

            {/* Pending Slips */}
            {pendingSlips.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                        <FileCheck2 size={18} />
                        Bekleyen Sipariş Fişleri ({pendingSlips.length})
                    </h3>
                    <div className="space-y-2">
                        {pendingSlips.map(slip => (
                            <div key={slip.id} className="flex justify-between items-center bg-zinc-900/50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-medium">{slip.slipNo}</span>
                                    <span className="text-zinc-500 text-sm">{formatDate(slip.date)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-amber-400">{formatCurrency(slip.totalAmount)}</span>
                                    <button
                                        onClick={() => setDeleteConfirm({ type: 'slip', id: slip.id })}
                                        className="p-1 text-zinc-500 hover:text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                    <h3 className="font-semibold text-white">Hesap Hareketleri</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                    {timeline.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            Henüz hareket yok.
                        </div>
                    ) : (
                        timeline.map((item, idx) => (
                            <div key={`${item.type}-${item.type === 'invoice' ? item.data.id : item.type === 'payment' ? item.data.id : item.data.id}-${idx}`} className="p-4 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'invoice' ? 'bg-red-500/20 text-red-400' :
                                    item.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {item.type === 'invoice' ? <Receipt size={18} /> :
                                        item.type === 'payment' ? <CreditCard size={18} /> :
                                            <FileText size={18} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">
                                            {item.type === 'invoice' ? `Fatura: ${item.data.invoiceNo}` :
                                                item.type === 'payment' ? `Ödeme (${item.data.method === 'cash' ? 'Nakit' : item.data.method === 'card' ? 'Kart' : 'EFT'})` :
                                                    `Sipariş Fişi: ${item.data.slipNo}`}
                                        </span>
                                        {item.type === 'slip' && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.data.status === 'invoiced' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {item.data.status === 'invoiced' ? 'Faturalaştırıldı' : 'Bekliyor'}
                                            </span>
                                        )}
                                        {item.type === 'invoice' && (
                                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded">
                                                Vade: {formatDate(item.data.dueDate)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-zinc-500 text-sm">{formatDate(item.date)}</div>
                                </div>
                                <div className={`font-mono font-bold ${item.type === 'invoice' ? 'text-red-400' :
                                    item.type === 'payment' ? 'text-green-400' :
                                        item.data.status === 'pending' ? 'text-amber-400' : 'text-zinc-600'
                                    }`}>
                                    {item.type === 'invoice' ? `+${formatCurrency(item.data.totalAmount)}` :
                                        item.type === 'payment' ? `-${formatCurrency(item.data.amount)}` :
                                            formatCurrency(item.data.totalAmount)}
                                </div>
                                <div className="flex gap-1">
                                    {item.type === 'invoice' && (
                                        <button
                                            onClick={() => {
                                                setEditingInvoice(item.data as SupplierInvoice);
                                                setDocumentType('invoice');
                                                setIsDocumentModalOpen(true);
                                            }}
                                            className="p-1 text-zinc-600 hover:text-indigo-400"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteConfirm({
                                            type: item.type === 'invoice' ? 'invoice' : item.type === 'payment' ? 'payment' : 'slip',
                                            id: item.data.id
                                        })}
                                        className="p-1 text-zinc-600 hover:text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <SupplierModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                supplier={editingSupplier}
                onSave={(data) => {
                    if (editingSupplier) {
                        updateSupplier(editingSupplier.id, { ...editingSupplier, ...data });
                    } else {
                        addSupplier({
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            ...data
                        } as Supplier);
                    }
                    setIsSupplierModalOpen(false);
                }}
            />

            <DocumentModal
                isOpen={isDocumentModalOpen}
                onClose={() => {
                    setIsDocumentModalOpen(false);
                    setEditingInvoice(null);
                }}
                type={documentType}
                supplierId={selectedSupplierId}
                paymentTermDays={selectedSupplier?.paymentTermDays || 0}
                rawIngredients={rawIngredients}
                ingredientCategories={ingredientCategories}
                pendingSlips={pendingSlips}
                editingInvoice={editingInvoice}
                onSaveSlip={(slip) => {
                    addSupplierOrderSlip(slip);
                    setIsDocumentModalOpen(false);
                }}
                onSaveInvoice={(invoice, linkedSlipIds) => {
                    if (editingInvoice) {
                        updateSupplierInvoice(editingInvoice.id, invoice);
                    } else if (linkedSlipIds.length > 0) {
                        convertOrderSlipsToInvoice(linkedSlipIds, invoice);
                    } else {
                        addSupplierInvoice(invoice);
                    }
                    setIsDocumentModalOpen(false);
                    setEditingInvoice(null);
                }}
                onAddIngredient={addRawIngredient}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                supplierId={selectedSupplierId}
                invoices={supplierInvoicesList.filter(i => i.status !== 'paid')}
                onSave={(payment) => {
                    addSupplierPayment(payment);
                    setIsPaymentModalOpen(false);
                }}
            />

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onCancel={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Silme Onayı"
                message="Bu öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
            />

            {/* Payment Calendar Modal */}
            {isCalendarModalOpen && (
                <PaymentCalendarModal
                    isOpen={isCalendarModalOpen}
                    onClose={() => setIsCalendarModalOpen(false)}
                    items={allPendingItems.map(it => ({
                        id: it.id,
                        supplierId: it.supplierId,
                        no: it.no,
                        date: it.referenceDate,
                        amount: it.amount,
                        type: it.type
                    }))}
                    suppliers={suppliers}
                />
            )}
        </div>
    );
}

// ============================================
// Payment Calendar Modal Component
// ============================================
interface PaymentCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: {
        id: string;
        supplierId: string;
        no: string;
        date: string;
        amount: number;
        type: 'invoice' | 'slip';
    }[];
    suppliers: Supplier[];
}

function PaymentCalendarModal({ isOpen, onClose, items, suppliers }: PaymentCalendarModalProps) {
    const [viewDate, setViewDate] = useState(new Date());

    if (!isOpen) return null;

    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

    // Get the first day of the month (0 = Sunday, 1 = Monday...)
    // Adjust to start with Monday (Monday = 0, Sunday = 6)
    let firstDayIdx = startOfMonth.getDay() - 1;
    if (firstDayIdx === -1) firstDayIdx = 6;

    const daysInMonth = endOfMonth.getDate();
    const prevMonthLastDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    const calendarDays = [];

    // Previous month padding
    for (let i = firstDayIdx - 1; i >= 0; i--) {
        calendarDays.push({
            day: prevMonthLastDay - i,
            month: 'prev',
            fullDate: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevMonthLastDay - i)
        });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
            day: i,
            month: 'current',
            fullDate: new Date(viewDate.getFullYear(), viewDate.getMonth(), i)
        });
    }

    // Next month padding
    const remainingCells = 42 - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        calendarDays.push({
            day: i,
            month: 'next',
            fullDate: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i)
        });
    }

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Ödeme Takvimi</h3>
                            <p className="text-zinc-500 text-sm">Aylık ödeme ve sipariş fişi planı</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="px-4 font-bold text-white min-w-[140px] text-center">
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto p-4 select-none">
                    <div className="grid grid-cols-7 gap-px bg-zinc-800 border border-zinc-800 rounded-xl overflow-hidden min-w-[700px]">
                        {/* Weekday Names */}
                        {weekDays.map(day => (
                            <div key={day} className="bg-zinc-900 p-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}

                        {/* Days */}
                        {calendarDays.map((cell, idx) => {
                            const dateStr = cell.fullDate.toISOString().split('T')[0];
                            const dayItems = items.filter(it => it.date === dateStr);
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                                <div
                                    key={idx}
                                    className={`bg-zinc-900 min-h-[100px] p-2 flex flex-col gap-1 transition-colors ${cell.month !== 'current' ? 'opacity-30 grayscale-[50%]' : ''
                                        } ${isToday ? 'ring-1 ring-inset ring-indigo-500/50 bg-indigo-500/5' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm font-bold ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' :
                                            cell.month === 'current' ? 'text-zinc-400' : 'text-zinc-600'
                                            }`}>
                                            {cell.day}
                                        </span>
                                        {dayItems.length > 0 && (
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                {formatCurrency(dayItems.reduce((sum, it) => sum + it.amount, 0))}
                                            </span>
                                        )}
                                    </div>

                                    {/* Day Items */}
                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                        {dayItems.map(it => {
                                            const supplier = suppliers.find(s => s.id === it.supplierId);
                                            return (
                                                <div
                                                    key={it.id}
                                                    className={`text-[9px] p-1 rounded border leading-tight ${it.type === 'invoice'
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                        }`}
                                                >
                                                    <div className="font-bold truncate">{supplier?.name}</div>
                                                    <div className="flex justify-between items-center gap-1">
                                                        <span className="opacity-70 truncate">{it.no}</span>
                                                        <span className="font-mono">{formatCurrency(it.amount)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 bg-zinc-900/50 rounded-b-2xl">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40"></div>
                            <span>Fatura (Kalan Tutar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></div>
                            <span>Sipariş Fişi (Bekleyen)</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
                            <div className="w-3 h-3 rounded ring-1 ring-inset ring-indigo-500/50 bg-indigo-500/10"></div>
                            <span>Bugün</span>
                        </div>
                    </div>
                    <div className="font-medium text-zinc-400 italic">
                        * Referans tarihler vadenin dolduğu günleri temsil eder.
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SUPPLIER MODAL
// ============================================
interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
    onSave: (data: Partial<Supplier>) => void;
}

function SupplierModal({ isOpen, onClose, supplier, onSave }: SupplierModalProps) {
    const [name, setName] = useState('');
    const [paymentTermDays, setPaymentTermDays] = useState(30);
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');

    // Reset form when modal opens
    useMemo(() => {
        if (isOpen) {
            setName(supplier?.name || '');
            setPaymentTermDays(supplier?.paymentTermDays || 30);
            setContactPerson(supplier?.contactPerson || '');
            setPhone(supplier?.phone || '');
        }
    }, [isOpen, supplier]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), paymentTermDays, contactPerson, phone });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-lg font-bold text-white">
                            {supplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Tedarikçi Adı *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                placeholder="Örn: Defne Gıda"
                                autoFocus
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Vade Süresi (Gün) *</label>
                            <NumberInput
                                value={paymentTermDays}
                                onChange={setPaymentTermDays}
                                className="w-full bg-zinc-800"
                                step={1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">İletişim Kişisi</label>
                            <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Telefon</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">
                            {supplier ? 'Güncelle' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// DOCUMENT MODAL (Slip / Invoice)
// ============================================
interface DocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'slip' | 'invoice';
    supplierId: string;
    paymentTermDays: number;
    rawIngredients: RawIngredient[];
    ingredientCategories: IngredientCategory[];
    pendingSlips: SupplierOrderSlip[];
    editingInvoice: SupplierInvoice | null;
    onSaveSlip: (slip: SupplierOrderSlip) => void;
    onSaveInvoice: (invoice: SupplierInvoice, linkedSlipIds: string[]) => void;
    onAddIngredient: (ingredient: RawIngredient) => void;
}

function DocumentModal({ isOpen, onClose, type, supplierId, paymentTermDays, rawIngredients, ingredientCategories, pendingSlips, editingInvoice, onSaveSlip, onSaveInvoice, onAddIngredient }: DocumentModalProps) {
    const [docNo, setDocNo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<SupplierInvoiceItem[]>([]);
    const [notes, setNotes] = useState('');
    const [linkedSlipIds, setLinkedSlipIds] = useState<string[]>([]);

    // Item form state
    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [unitType, setUnitType] = useState<'adet' | 'kutu' | 'koli' | 'kg' | 'lt' | 'paket'>('adet');
    const [unitPrice, setUnitPrice] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [vatRate, setVatRate] = useState(10);

    // Product search state
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIngredientCategoryId, setNewIngredientCategoryId] = useState('');

    // Item editing state
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Filter products by search query
    const filteredProducts = rawIngredients.filter(i =>
        i.name.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
    const showAddNewOption = productSearchQuery.trim() &&
        !rawIngredients.some(i => i.name.toLowerCase() === productSearchQuery.toLowerCase());

    // Calculate due date
    const dueDate = useMemo(() => {
        const d = new Date(date);
        d.setDate(d.getDate() + paymentTermDays);
        return d.toISOString().split('T')[0];
    }, [date, paymentTermDays]);

    // Calculate totals
    const totalAmount = useMemo(() => {
        const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const slipsTotal = linkedSlipIds.reduce((sum, id) => {
            const slip = pendingSlips.find(s => s.id === id);
            return sum + (slip?.totalAmount || 0);
        }, 0);
        return itemsTotal + slipsTotal;
    }, [items, linkedSlipIds, pendingSlips]);

    // Reset form when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useMemo(() => {
        if (isOpen) {
            if (editingInvoice) {
                // Editing existing invoice
                setDocNo(editingInvoice.invoiceNo);
                setDate(editingInvoice.date);
                setItems(editingInvoice.items);
                setNotes(editingInvoice.notes || '');
                setLinkedSlipIds(editingInvoice.linkedOrderSlipIds || []);
            } else {
                // New invoice/slip
                setDocNo('');
                setDate(new Date().toISOString().split('T')[0]);
                setItems([]);
                setNotes('');
                setLinkedSlipIds([]);
            }
            setSelectedIngredientId('');
            setQuantity(0);
            setUnitType('adet');
            setUnitPrice(0);
            setDiscountPercent(0);
            setVatRate(10);
            setProductSearchQuery('');
            setIsProductDropdownOpen(false);
        }
    }, [isOpen, editingInvoice]);

    if (!isOpen) return null;

    const selectProduct = (id: string) => {
        setSelectedIngredientId(id);
        const product = rawIngredients.find(i => i.id === id);
        if (product) {
            setProductSearchQuery(product.name);
        }
        setIsProductDropdownOpen(false);
    };

    const handleQuickAddIngredient = () => {
        if (!newIngredientName.trim() || !newIngredientCategoryId) return;

        const newIngredient: RawIngredient = {
            id: crypto.randomUUID(),
            name: newIngredientName.trim(),
            categoryId: newIngredientCategoryId,
            price: 0,
            unit: 'kg'
        };

        onAddIngredient(newIngredient);
        setSelectedIngredientId(newIngredient.id);
        setProductSearchQuery(newIngredient.name);
        setShowQuickAddModal(false);
        setNewIngredientName('');
        setNewIngredientCategoryId('');
    };

    const addItem = () => {
        if (!selectedIngredientId || quantity <= 0 || unitPrice <= 0) return;
        const ingredient = rawIngredients.find(i => i.id === selectedIngredientId);
        if (!ingredient) return;

        const subtotal = quantity * unitPrice;
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const vatAmount = afterDiscount * (vatRate / 100);
        const total = afterDiscount + vatAmount;

        const newItem: SupplierInvoiceItem = {
            id: editingItemId || crypto.randomUUID(),
            rawIngredientId: ingredient.id,
            name: ingredient.name,
            quantity,
            unitType,
            unitPrice,
            discountPercent,
            vatRate,
            subtotal,
            discountAmount,
            vatAmount,
            totalPrice: total
        };

        if (editingItemId) {
            // Update existing item
            setItems(items.map(i => i.id === editingItemId ? newItem : i));
            setEditingItemId(null);
        } else {
            // Add new item
            setItems([...items, newItem]);
        }
        setSelectedIngredientId('');
        setProductSearchQuery('');
        setQuantity(0);
        setUnitPrice(0);
        // Keep unitType, discountPercent, vatRate for next item
    };

    const editItem = (item: SupplierInvoiceItem) => {
        setEditingItemId(item.id);
        setSelectedIngredientId(item.rawIngredientId);
        setProductSearchQuery(item.name);
        setQuantity(item.quantity);
        setUnitType(item.unitType);
        setUnitPrice(item.unitPrice);
        setDiscountPercent(item.discountPercent);
        setVatRate(item.vatRate);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        if (editingItemId === id) {
            setEditingItemId(null);
            setSelectedIngredientId('');
            setProductSearchQuery('');
            setQuantity(0);
            setUnitPrice(0);
        }
    };

    const toggleSlipLink = (slipId: string) => {
        if (linkedSlipIds.includes(slipId)) {
            setLinkedSlipIds(linkedSlipIds.filter(id => id !== slipId));
        } else {
            setLinkedSlipIds([...linkedSlipIds, slipId]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!docNo.trim()) return;
        if (type === 'invoice' && items.length === 0 && linkedSlipIds.length === 0) return;
        if (type === 'slip' && items.length === 0) return;

        if (type === 'slip') {
            onSaveSlip({
                id: crypto.randomUUID(),
                supplierId,
                slipNo: docNo.trim(),
                date,
                items,
                totalAmount: items.reduce((sum, i) => sum + i.totalPrice, 0),
                status: 'pending',
                notes
            });
        } else {
            onSaveInvoice({
                id: crypto.randomUUID(),
                supplierId,
                invoiceNo: docNo.trim(),
                date,
                dueDate,
                items,
                linkedOrderSlipIds: linkedSlipIds,
                totalAmount,
                paidAmount: 0,
                status: 'pending',
                notes
            }, linkedSlipIds);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-in zoom-in-95 fade-in duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
                        <h3 className="text-lg font-bold text-white">
                            {type === 'slip' ? 'Yeni Sipariş Fişi' : 'Yeni Fatura'}
                        </h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    {type === 'slip' ? 'Fiş No' : 'Fatura No'} *
                                </label>
                                <input
                                    type="text"
                                    value={docNo}
                                    onChange={(e) => setDocNo(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Tarih *</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Due Date (Invoice only) */}
                        {type === 'invoice' && (
                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-indigo-400 text-sm">Vade Tarihi ({paymentTermDays} gün)</span>
                                <span className="font-mono text-white font-bold">{dueDate}</span>
                            </div>
                        )}

                        {/* Link Pending Slips (Invoice only) */}
                        {type === 'invoice' && pendingSlips.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Bekleyen Sipariş Fişlerini Bağla</label>
                                <div className="space-y-2 max-h-40 overflow-auto">
                                    {pendingSlips.map(slip => (
                                        <label key={slip.id} className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3 cursor-pointer hover:bg-zinc-700">
                                            <input
                                                type="checkbox"
                                                checked={linkedSlipIds.includes(slip.id)}
                                                onChange={() => toggleSlipLink(slip.id)}
                                                className="rounded bg-zinc-700 border-zinc-600 text-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <span className="text-white">{slip.slipNo}</span>
                                                <span className="text-zinc-500 text-sm ml-2">{slip.date}</span>
                                            </div>
                                            <span className="font-mono text-amber-400">{formatCurrency(slip.totalAmount)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Items */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-zinc-400">Ürün Ekle</label>

                            {/* Row 1: Product, Quantity, Unit Type */}
                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-5 relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                        <input
                                            type="text"
                                            value={productSearchQuery}
                                            onChange={(e) => {
                                                setProductSearchQuery(e.target.value);
                                                setIsProductDropdownOpen(true);
                                                if (!e.target.value) setSelectedIngredientId('');
                                            }}
                                            onFocus={() => setIsProductDropdownOpen(true)}
                                            placeholder="Ürün ara veya yeni ekle..."
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        />
                                        {selectedIngredientId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedIngredientId('');
                                                    setProductSearchQuery('');
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {isProductDropdownOpen && (productSearchQuery || filteredProducts.length > 0) && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                                            {filteredProducts.slice(0, 10).map(product => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => selectProduct(product.id)}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-zinc-700 text-sm ${selectedIngredientId === product.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-white'
                                                        }`}
                                                >
                                                    {product.name}
                                                </div>
                                            ))}
                                            {showAddNewOption && (
                                                <div
                                                    onClick={() => {
                                                        setNewIngredientName(productSearchQuery.trim());
                                                        setShowQuickAddModal(true);
                                                        setIsProductDropdownOpen(false);
                                                    }}
                                                    className="px-3 py-2 cursor-pointer bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm border-t border-zinc-700 flex items-center gap-2"
                                                >
                                                    <Plus size={14} />
                                                    "{productSearchQuery}" yeni ürün olarak ekle
                                                </div>
                                            )}
                                            {filteredProducts.length === 0 && !showAddNewOption && (
                                                <div className="px-3 py-4 text-center text-zinc-500 text-sm">
                                                    Ürün bulunamadı
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-3">
                                    <NumberInput
                                        value={quantity}
                                        onChange={setQuantity}
                                        className="w-full bg-zinc-800"
                                        placeholder="Miktar"
                                        step={0.1}
                                    />
                                </div>
                                <div className="col-span-4">
                                    <select
                                        value={unitType}
                                        onChange={(e) => setUnitType(e.target.value as typeof unitType)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                                    >
                                        <option value="adet">Adet</option>
                                        <option value="kutu">Kutu</option>
                                        <option value="koli">Koli</option>
                                        <option value="kg">Kg</option>
                                        <option value="lt">Lt</option>
                                        <option value="paket">Paket</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Unit Price, Discount, VAT, Add Button */}
                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-3">
                                    <div className="text-xs text-zinc-500 mb-1">Birim Fiyat</div>
                                    <NumberInput
                                        value={unitPrice}
                                        onChange={setUnitPrice}
                                        className="w-full bg-zinc-800"
                                        step={0.01}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <div className="text-xs text-zinc-500 mb-1">İskonto %</div>
                                    <NumberInput
                                        value={discountPercent}
                                        onChange={setDiscountPercent}
                                        className="w-full bg-zinc-800"
                                        step={1}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <div className="text-xs text-zinc-500 mb-1">KDV %</div>
                                    <select
                                        value={vatRate}
                                        onChange={(e) => setVatRate(Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                                    >
                                        <option value={0}>%0</option>
                                        <option value={1}>%1</option>
                                        <option value={10}>%10</option>
                                        <option value={20}>%20</option>
                                    </select>
                                </div>
                                <div className="col-span-3 flex items-end">
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        disabled={!selectedIngredientId || quantity <= 0 || unitPrice <= 0}
                                        className={`w-full px-3 py-2 ${editingItemId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium`}
                                    >
                                        {editingItemId ? '✓ Güncelle' : '+ Ekle'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        {items.length > 0 && (
                            <div className="bg-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead className="bg-zinc-700 text-zinc-400">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Ürün</th>
                                            <th className="px-2 py-2 text-center">Miktar</th>
                                            <th className="px-2 py-2 text-right">B.Fiyat</th>
                                            <th className="px-2 py-2 text-center">İsk.%</th>
                                            <th className="px-2 py-2 text-center">KDV%</th>
                                            <th className="px-2 py-2 text-right">Toplam</th>
                                            <th className="px-2 py-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-700">
                                        {items.map(item => (
                                            <tr key={item.id} className={editingItemId === item.id ? 'bg-amber-500/10' : ''}>
                                                <td className="px-2 py-2 text-white">{item.name}</td>
                                                <td className="px-2 py-2 text-center text-zinc-400">
                                                    {item.quantity} {item.unitType}
                                                </td>
                                                <td className="px-2 py-2 text-right font-mono text-zinc-400">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="px-2 py-2 text-center text-zinc-400">
                                                    {item.discountPercent > 0 ? `%${item.discountPercent}` : '-'}
                                                </td>
                                                <td className="px-2 py-2 text-center text-zinc-400">%{item.vatRate}</td>
                                                <td className="px-2 py-2 text-right font-mono text-white font-bold">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                                <td className="px-2 py-2">
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => editItem(item)}
                                                            className={`text-zinc-500 hover:text-indigo-400 ${editingItemId === item.id ? 'text-amber-400' : ''}`}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button type="button" onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Notlar</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none resize-none h-20"
                            />
                        </div>

                        {/* Total */}
                        <div className="bg-zinc-800 rounded-lg p-4 flex justify-between items-center">
                            <span className="text-zinc-400">Toplam Tutar</span>
                            <span className="font-mono text-2xl font-bold text-white">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-zinc-900">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={!docNo.trim() || (items.length === 0 && linkedSlipIds.length === 0)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Add Ingredient Modal */}
            {showQuickAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <h4 className="font-bold text-white">Yeni Ürün Ekle</h4>
                            <button
                                type="button"
                                onClick={() => setShowQuickAddModal(false)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Ürün Adı</label>
                                <input
                                    type="text"
                                    value={newIngredientName}
                                    onChange={(e) => setNewIngredientName(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Kategori *</label>
                                <select
                                    value={newIngredientCategoryId}
                                    onChange={(e) => setNewIngredientCategoryId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Kategori seç...</option>
                                    {ingredientCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowQuickAddModal(false)}
                                className="px-4 py-2 text-zinc-400 hover:text-white"
                            >
                                İptal
                            </button>
                            <button
                                type="button"
                                onClick={handleQuickAddIngredient}
                                disabled={!newIngredientName.trim() || !newIngredientCategoryId}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-medium"
                            >
                                Ürün Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// PAYMENT MODAL
// ============================================
interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: string;
    invoices: SupplierInvoice[];
    onSave: (payment: SupplierPayment) => void;
}

function PaymentModal({ isOpen, onClose, supplierId, invoices, onSave }: PaymentModalProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState<'cash' | 'card' | 'eft'>('cash');
    const [invoiceId, setInvoiceId] = useState('');
    const [notes, setNotes] = useState('');

    // Reset form when modal opens
    useMemo(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setAmount(0);
            setMethod('cash');
            setInvoiceId('');
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;

        onSave({
            id: crypto.randomUUID(),
            supplierId,
            invoiceId: invoiceId || undefined,
            date,
            amount,
            method,
            notes
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-lg font-bold text-white">Yeni Ödeme</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Tarih *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Tutar *</label>
                            <NumberInput
                                value={amount}
                                onChange={setAmount}
                                className="w-full bg-zinc-800"
                                step={0.01}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Ödeme Yöntemi</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['cash', 'card', 'eft'] as const).map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMethod(m)}
                                        className={`py-2 rounded-lg font-medium text-sm transition-colors ${method === m
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {m === 'cash' ? 'Nakit' : m === 'card' ? 'Kart' : 'EFT'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {invoices.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Faturaya Bağla (İsteğe Bağlı)</label>
                                <select
                                    value={invoiceId}
                                    onChange={(e) => setInvoiceId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Bağlama</option>
                                    {invoices.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.invoiceNo} - Kalan: {formatCurrency(inv.totalAmount - inv.paidAmount)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Notlar</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={amount <= 0}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-medium"
                        >
                            Ödeme Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
