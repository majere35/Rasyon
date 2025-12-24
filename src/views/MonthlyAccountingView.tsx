
import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { MonthlyMonthData, Invoice, DailySale } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { MonthlyBalanceTab } from '../components/MonthlyBalanceTab';
import { ConfirmModal } from '../components/ConfirmModal';
import { expenseCategoryOptions, getCategoryLabel } from '../data/expenseCategories';
import { MonthlyReportTemplate } from '../components/MonthlyReportTemplate';
import { Loader2, Plus, Lock, Unlock, FileText, CheckCircle, AlertCircle, Pencil, Trash2, ChevronDown, ChevronLeft, ChevronRight, Calendar, Check, X, Printer } from 'lucide-react';
import { calculateIncomeTax, getAvailableVatCarryOver, calculateVatStatus } from '../utils/taxUtils';
import { appConfig } from '../config/appConfig';

// Basic formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const formatDateTR = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'numeric', year: 'numeric', weekday: 'long' }).format(date);
};

export const MonthlyAccountingView = () => {
    // Access Global Store
    const { monthlyClosings, saveMonthlyData } = useStore();

    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'expenses' | 'sales' | 'balance'>('expenses');

    // Data State (Managed locally via Store, but kept in component state for editing before save?)
    // Actually, let's sync directly from store or keep local draft?
    // User expects "Save" button. So let's keep local draft, load from store on mount/monthChange.
    const [data, setData] = useState<MonthlyMonthData | null>(null);

    useEffect(() => {
        loadMonthData(selectedMonth);
    }, [selectedMonth, monthlyClosings]);
    // Dependency on monthlyClosings ensures if we import a backup, this updates.

    const loadMonthData = (monthStr: string) => {
        setLoading(true);
        // Simulate "fetching" although it's instant local
        setTimeout(() => {
            const existing = monthlyClosings.find(m => m.monthStr === monthStr);
            if (existing) {
                setData(existing);
            } else {
                // Initialize empty Month Data
                setData({
                    id: monthStr,
                    monthStr: monthStr,
                    isClosed: false,
                    invoices: [],
                    dailySales: []
                });
            }
            setLoading(false);
        }, 100); // 100ms fake delay for smooth transition feel
    };



    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger' as 'danger' | 'warning' | 'info'
    });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    // Print Preview Modal State
    const [showReportTypeModal, setShowReportTypeModal] = useState(false);
    const [reportType, setReportType] = useState<'summary' | 'detailed' | null>(null);

    const handlePrint = () => {
        const printContent = document.getElementById('monthly-report-template');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8">
                <title>Aylık Rapor - ${data?.monthStr}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        @page { size: A4; margin: 0; }
                    }
                    body { font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif; }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
                <script>
                    setTimeout(() => { window.print(); }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleLock = async () => {
        if (!data) return;

        setConfirmModal({
            isOpen: true,
            title: 'Ayı Kapat',
            message: 'Bu ayı kapatmak üzeresiniz. Veriler kilitlenecek ve değiştirilemeyecek. Emin misiniz?',
            type: 'warning',
            onConfirm: () => executeLock()
        });
    };

    const executeLock = () => {
        if (!data) return;
        const totalExpenses = data.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalIncome = data.dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const netProfit = totalIncome - totalExpenses;

        setSaving(true);
        const newData = { ...data, isClosed: true, totalExpenses, totalIncome, netProfit, closedAt: new Date().toISOString() };
        saveMonthlyData(newData);
        setData(newData);
        setSaving(false);
        closeConfirm();
    };

    const handleUnlock = async () => {
        if (!data) return;

        setConfirmModal({
            isOpen: true,
            title: 'Kilidi Aç',
            message: 'Bu ayı tekrar DÜZENLEMEK için açmak üzeresiniz. Veriler değiştirilebilir hale gelecek. Devam edilsin mi?',
            type: 'danger',
            onConfirm: () => executeUnlock()
        });
    };

    const executeUnlock = () => {
        if (!data) return;
        setSaving(true);
        const newData = { ...data, isClosed: false };
        saveMonthlyData(newData);
        setData(newData);
        setSaving(false);
        closeConfirm();
    };

    const isReadOnly = data?.isClosed || false;

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Month Selector */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Gerçekleşen Ay Hesapları (Yerel Mod)</h2>
                        <p className="text-xs text-zinc-500">Gelir ve Giderlerinizi aylık olarak takip edin.</p>
                    </div>
                </div>



                <div className="flex items-center gap-2">
                    <MonthSelector
                        selectedMonth={selectedMonth}
                        onChange={setSelectedMonth}
                        closings={monthlyClosings}
                    />

                    {data?.isClosed ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span>KAPALI DÖNEM</span>
                        </div>
                    ) : (data && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-sm font-medium">
                            <AlertCircle className="w-4 h-4" />
                            <span>OTOMATİK KAYIT AÇIK</span>
                        </div>
                    ))}

                    {data?.isClosed ? (
                        <>
                            <button
                                onClick={() => setShowReportTypeModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                PDF Yazdır
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={saving || loading}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <Unlock className="w-4 h-4" />
                                Düzenle (Kilidi Aç)
                            </button>
                        </>
                    ) : (data && (
                        <button
                            onClick={handleLock}
                            disabled={saving || loading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Lock className="w-4 h-4" />
                            Ayı Kapat
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => setActiveTab('expenses')}
                    disabled={!data}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'expenses' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    Gider Girişi (Fatura)
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    disabled={!data}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sales' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    Gelir Girişi (Satış)
                </button>
                <button
                    onClick={() => setActiveTab('balance')}
                    disabled={!data}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'balance' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    Aylık Bilanço
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-start justify-center pt-20">
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-xl flex items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-600" />
                            <span>Veriler getiriliyor...</span>
                        </div>
                    </div>
                )}

                {data ? (
                    <>
                        <>
                            {activeTab === 'expenses' && (
                                <ExpensesTab
                                    data={data}
                                    isReadOnly={isReadOnly}
                                    onChange={(newData) => {
                                        setData(newData);
                                        saveMonthlyData(newData);
                                    }}
                                />
                            )}
                            {activeTab === 'sales' && (
                                <SalesTab
                                    data={data}
                                    isReadOnly={isReadOnly}
                                    onChange={(newData) => {
                                        setData(newData);
                                        saveMonthlyData(newData);
                                    }}
                                />
                            )}
                            {activeTab === 'balance' && (
                                <MonthlyBalanceTab data={data} />
                            )}
                        </>
                    </>
                ) : (
                    !loading && <div className="text-center p-12 text-zinc-500">Görüntülenecek veri yok.</div>
                )}
            </div>
            {/* Main View Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
                type={confirmModal.type}
            />

            {/* Report Type Selection Modal */}
            {showReportTypeModal && data && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Rapor Türü Seçin</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setReportType('summary');
                                    setShowReportTypeModal(false);
                                }}
                                className="w-full p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors text-left"
                            >
                                <div className="font-bold text-zinc-900 dark:text-white">Özet Rapor</div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Kategorilerin toplamlarını gösteren özet bilanço</p>
                            </button>
                            <button
                                onClick={() => {
                                    setReportType('detailed');
                                    setShowReportTypeModal(false);
                                }}
                                className="w-full p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors text-left"
                            >
                                <div className="font-bold text-zinc-900 dark:text-white">Detaylı Rapor</div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Tüm gider kalemlerini açıklamalarıyla birlikte listeler</p>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowReportTypeModal(false)}
                            className="w-full mt-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {/* Print Preview Modal */}
            {reportType && data && (
                <PrintPreviewModal
                    data={data}
                    reportType={reportType}
                    onClose={() => setReportType(null)}
                    onPrint={handlePrint}
                />
            )}
        </div>
    );
};

// --- Sub-Components ---

// Print Preview Modal with Report Template
const PrintPreviewModal = ({ data, reportType, onClose, onPrint }: { data: MonthlyMonthData, reportType: 'summary' | 'detailed', onClose: () => void, onPrint: () => void }) => {
    const { monthlyClosings, company, onlineCommissionRate } = useStore();

    // Calculate aggregated data (same logic as MonthlyBalanceTab)
    const aggregatedData = useMemo(() => {
        const invoices = data.invoices || [];
        const dailySales = data.dailySales || [];

        const totalOnlineSales = dailySales.reduce((sum, sale) => {
            return sum + (sale.yemeksepeti || 0) + (sale.trendyol || 0) + (sale.getirYemek || 0) + (sale.migrosYemek || 0);
        }, 0);
        const commissionCost = totalOnlineSales * (onlineCommissionRate / 100);
        const commissionVat = commissionCost * (appConfig.commissionVat.rate / 100);

        // Initialize sums and details
        const sums: Record<string, number> = {
            rent: 0, bills: 0, accounting: 0, pos: 0, security: 0,
            food: 0, packaging: 0, waste: 0, maintenance: 0,
            marketing: 0, courier: 0,
            salary: 0, sgk: 0, benefits: 0,
            taxes: 0, other: 0,
            totalDeductibleVat: commissionVat,
            totalStopajTax: 0
        };

        const details: Record<string, Invoice[]> = {
            rent: [], bills: [], accounting: [], pos: [], security: [],
            food: [], packaging: [], waste: [], maintenance: [],
            marketing: [], courier: [],
            salary: [], sgk: [], benefits: [],
            taxes: [], other: []
        };

        invoices.forEach(inv => {
            const category = inv.category || 'diger';
            const amt = inv.amount || 0;

            // TAX CALCULATIONS
            if (category === 'kira') {
                if (inv.taxMethod === 'stopaj') {
                    const gross = amt / 0.8;
                    const stopaj = gross * 0.20;
                    sums.totalStopajTax += stopaj;
                } else {
                    sums.totalDeductibleVat += amt * ((inv.taxRate || 20) / 100);
                }
            } else {
                sums.totalDeductibleVat += amt * ((inv.taxRate !== undefined ? inv.taxRate : 20) / 100);
            }

            let key = 'other';
            switch (category) {
                case 'kira': key = 'rent'; break;
                case 'faturalar': key = 'bills'; break;
                case 'muhasebe': key = 'accounting'; break;
                case 'vergi': key = 'taxes'; break;
                case 'pos': key = 'pos'; break;
                case 'guvenlik': key = 'security'; break;
                case 'gida': key = 'food'; break;
                case 'ambalaj': key = 'packaging'; break;
                case 'fire': key = 'waste'; break;
                case 'bakim': key = 'maintenance'; break;
                case 'reklam': key = 'marketing'; break;
                case 'kurye': key = 'courier'; break;
                case 'maas': key = 'salary'; break;
                case 'sgk': key = 'sgk'; break;
                case 'yan_haklar': key = 'benefits'; break;
                default: key = 'other'; break;
            }

            sums[key] += amt;
            details[key].push(inv);
        });

        const totalRevenue = dailySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

        return {
            totalRevenue,
            totalStopajTax: sums.totalStopajTax,
            totalDeductibleVat: sums.totalDeductibleVat,
            groups: [
                {
                    id: 'general', title: 'GENEL YÖNETİM',
                    items: [
                        { name: 'Kira', amount: sums.rent, details: details.rent },
                        { name: 'Faturalar (Elektrik/Su/İnternet)', amount: sums.bills, details: details.bills },
                        { name: 'Muhasebe', amount: sums.accounting, details: details.accounting },
                        { name: 'Vergi ve Harçlar', amount: sums.taxes, details: details.taxes },
                        { name: 'Pos Yazılım', amount: sums.pos, details: details.pos },
                        { name: 'İlaçlama ve Güvenlik', amount: sums.security, details: details.security },
                        ...(sums.other > 0 ? [{ name: 'Diğer', amount: sums.other, details: details.other }] : [])
                    ]
                },
                {
                    id: 'production', title: 'ÜRETİM GİDERLERİ',
                    items: [
                        { name: 'Gıda Hammadde', amount: sums.food, details: details.food },
                        { name: 'Ambalaj', amount: sums.packaging, details: details.packaging },
                        { name: 'Fire/Zayii', amount: sums.waste, details: details.waste },
                        { name: 'Bakım/Onarım', amount: sums.maintenance, details: details.maintenance }
                    ]
                },
                {
                    id: 'sales', title: 'SATIŞ & DAĞITIM',
                    items: [
                        { name: 'Online Satış Komisyonları', amount: commissionCost, isAuto: true, note: `%${onlineCommissionRate}` },
                        { name: 'Reklam Giderleri', amount: sums.marketing, details: details.marketing },
                        { name: 'Kurye Masrafı', amount: sums.courier, details: details.courier }
                    ]
                },
                {
                    id: 'personnel', title: 'PERSONEL',
                    items: [
                        { name: 'Net Maaş', amount: sums.salary, details: details.salary },
                        { name: 'SGK', amount: sums.sgk, details: details.sgk },
                        { name: 'Yol, Yemek ve Yan Haklar', amount: sums.benefits, details: details.benefits }
                    ]
                }
            ]
        };
    }, [data, onlineCommissionRate]);

    const totalExpenses = aggregatedData.groups.reduce((sum: number, group: { items: { amount: number }[] }) => {
        return sum + group.items.reduce((gSum: number, item: { amount: number }) => gSum + item.amount, 0);
    }, 0);

    const netProfit = aggregatedData.totalRevenue - totalExpenses;

    // Calculate Taxes & VAT Carry-Over
    const carryInVat = getAvailableVatCarryOver(
        data.monthStr,
        monthlyClosings,
        onlineCommissionRate,
        appConfig.revenueVat.rate,
        appConfig.commissionVat.rate
    );

    const incomeVat = aggregatedData.totalRevenue * (appConfig.revenueVat.rate / 100);
    const { payableVat } = calculateVatStatus(incomeVat, aggregatedData.totalDeductibleVat, carryInVat);

    const annualProfit = netProfit * 12;
    const annualTax = calculateIncomeTax(annualProfit, company?.type || 'sahis');
    const monthlyTax = annualTax / 12;
    const totalTaxPayable = monthlyTax + payableVat + aggregatedData.totalStopajTax;
    const netProfitAfterTax = netProfit - totalTaxPayable;


    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-xl max-w-[230mm] w-full max-h-[95vh] overflow-auto shadow-2xl">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-lg font-bold text-gray-900">Rapor Önizleme</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={onPrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Yazdır
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Kapat
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-6">
                    <MonthlyReportTemplate
                        data={data}
                        aggregatedData={aggregatedData}
                        netProfit={netProfit}
                        netProfitAfterTax={netProfitAfterTax}
                        totalTaxPayable={totalTaxPayable}
                        carryInVat={carryInVat}
                        reportType={reportType}
                    />
                </div>
            </div>
        </div>
    );
};

const ExpensesTab = ({ data, isReadOnly, onChange }: { data: MonthlyMonthData, isReadOnly: boolean, onChange: (d: MonthlyMonthData) => void }) => {
    // New Invoice Form State
    const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
        date: new Date().toISOString().slice(0, 10),
        taxRate: 20,
        status: 'paid'
    });

    // Inline Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Invoice>>({});

    // Kategoriler merkezi dosyadan geliyor

    const addInvoice = () => {
        if (!newInvoice.supplier || !newInvoice.amount) return alert('Tedarikçi ve Tutar zorunludur.');

        const invoice: Invoice = {
            id: Date.now().toString(),
            date: newInvoice.date || new Date().toISOString().slice(0, 10),
            supplier: newInvoice.supplier,
            description: newInvoice.description || '',
            category: newInvoice.category || 'diger',
            amount: Number(newInvoice.amount),
            taxRate: Number(newInvoice.taxRate),
            status: newInvoice.status as 'paid' | 'pending' || 'paid',
            paymentDate: newInvoice.paymentDate,
            taxMethod: newInvoice.category === 'kira' ? (newInvoice.taxMethod || 'stopaj') : undefined
        };

        const updatedInvoices = [...data.invoices, invoice];
        onChange({ ...data, invoices: updatedInvoices });
        setNewInvoice({ ...newInvoice, supplier: '', description: '', amount: 0 });
    };

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger' as 'danger' | 'warning'
    });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const removeInvoice = (id: string) => {
        if (isReadOnly) return;

        setConfirmModal({
            isOpen: true,
            title: 'Faturayı Sil',
            message: 'Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            type: 'danger',
            onConfirm: () => {
                const updatedInvoices = data.invoices.filter(inv => inv.id !== id);
                onChange({ ...data, invoices: updatedInvoices });
                closeConfirm();
            }
        });
    };

    const startEdit = (invoice: Invoice) => {
        setEditingId(invoice.id);
        setEditForm({ ...invoice });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = () => {
        if (!editingId || !editForm.supplier || !editForm.amount) return alert('Eksik bilgi.');

        const updatedInvoices = data.invoices.map(inv => {
            if (inv.id === editingId) {
                return {
                    ...inv,
                    ...editForm,
                    amount: Number(editForm.amount),
                    taxRate: Number(editForm.taxRate),
                    taxMethod: editForm.category === 'kira' ? (editForm.taxMethod || 'stopaj') : undefined
                } as Invoice;
            }
            return inv;
        });

        onChange({ ...data, invoices: updatedInvoices });
        setEditingId(null);
        setEditForm({});
    };

    return (
        <div className="space-y-6">
            {/* ... form ... */}
            {!isReadOnly && (
                <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    {/* ... new invoice inputs ... */}
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Yeni Fatura Ekle</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:items-center gap-3">
                        {/* New Invoice Form Inputs */}
                        <div className="min-w-[130px] lg:w-[130px]">
                            <CustomDatePicker
                                value={newInvoice.date || ''}
                                onChange={v => setNewInvoice({ ...newInvoice, date: v })}
                                placeholder="Tarih"
                            />
                        </div>
                        <input type="text" placeholder="Tedarikçi" value={newInvoice.supplier || ''} onChange={e => setNewInvoice({ ...newInvoice, supplier: e.target.value })} className="p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm w-full lg:flex-1" />
                        <input type="text" placeholder="Açıklama" value={newInvoice.description || ''} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} className="p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm md:col-span-2 lg:flex-1" />
                        <div className="min-w-[120px] lg:w-[120px]">
                            <CustomSelect
                                value={newInvoice.category || 'diger'}
                                onChange={v => setNewInvoice({ ...newInvoice, category: v })}
                                options={expenseCategoryOptions}
                            />
                        </div>
                        <input type="number" placeholder="Tutar" value={newInvoice.amount || ''} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.valueAsNumber })} className="p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm lg:w-[100px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />

                        {/* Rent Specific: Tax Method Selector */}
                        {newInvoice.category === 'kira' && (
                            <div className="min-w-[100px] lg:w-[100px]">
                                <CustomSelect
                                    value={newInvoice.taxMethod || 'stopaj'}
                                    onChange={v => setNewInvoice({ ...newInvoice, taxMethod: v as any })}
                                    options={[
                                        { label: 'Stopaj', value: 'stopaj' },
                                        { label: 'KDV', value: 'kdv' }
                                    ]}
                                />
                            </div>
                        )}
                        <div className="min-w-[110px] lg:w-[110px]">
                            <CustomSelect
                                value={newInvoice.taxRate?.toString() || '20'}
                                onChange={v => setNewInvoice({ ...newInvoice, taxRate: Number(v) })}
                                options={[
                                    { label: '%0', value: '0' },
                                    { label: '%1', value: '1' },
                                    { label: '%10', value: '10' },
                                    { label: '%20', value: '20' }
                                ]}
                            />
                        </div>
                        <button onClick={addInvoice} className="bg-indigo-600 text-white rounded p-2 text-sm font-medium hover:bg-indigo-700 h-10 w-10 flex items-center justify-center flex-shrink-0"><Plus className="w-5 h-5" /></button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left">
                    {/* ... table content ... */}
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-medium">
                        <tr>
                            <th className="p-3">Tarih</th>
                            <th className="p-3">Tedarikçi</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3">Açıklama</th>
                            <th className="p-3 text-right">Tutar</th>
                            <th className="p-3 text-right">KDV</th>
                            {!isReadOnly && <th className="p-3 w-20"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {data.invoices.length === 0 && (
                            <tr><td colSpan={7} className="p-4 text-center text-zinc-500">Henüz fatura girişi yapılmamış.</td></tr>
                        )}
                        {data.invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                {editingId === inv.id ? (
                                    <>
                                        <td className="p-2"><input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="w-full p-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert" /></td>
                                        <td className="p-2"><input type="text" value={editForm.supplier} onChange={e => setEditForm({ ...editForm, supplier: e.target.value })} className="w-full p-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700" /></td>
                                        <td className="p-2">
                                            <CustomSelect
                                                value={editForm.category || 'diger'}
                                                onChange={v => setEditForm({ ...editForm, category: v })}
                                                options={expenseCategoryOptions}
                                            />
                                        </td>
                                        <td className="p-2"><input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700" /></td>
                                        <td className="p-2"><input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.valueAsNumber })} className="w-full p-1 border rounded text-right bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2">
                                            <CustomSelect
                                                value={editForm.taxRate?.toString() || '20'}
                                                onChange={v => setEditForm({ ...editForm, taxRate: Number(v) })}
                                                options={[
                                                    { label: '%0', value: '0' },
                                                    { label: '%1', value: '1' },
                                                    { label: '%10', value: '10' },
                                                    { label: '%20', value: '20' }
                                                ]}
                                            />
                                        </td>
                                        <td className="p-2 flex items-center justify-end gap-1">
                                            <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded"><CheckCircle className="w-5 h-5" /></button>
                                            <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-100 rounded ml-1"><AlertCircle className="w-5 h-5 rotate-45" /></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-3 whitespace-nowrap">{formatDateTR(inv.date)}</td>
                                        <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">{inv.supplier}</td>
                                        <td className="p-3 text-xs text-zinc-500 opacity-70">{getCategoryLabel(inv.category)}</td>
                                        <td className="p-3 text-zinc-500 truncate max-w-[200px]">{inv.description}</td>
                                        <td className="p-3 text-right font-medium text-red-600 dark:text-red-400">{formatCurrency(inv.amount)}</td>
                                        <td className="p-3 text-right text-zinc-500">
                                            {inv.category === 'kira' && inv.taxMethod === 'stopaj' ? (
                                                <span className="text-orange-500 font-bold text-xs bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">STOPAJ</span>
                                            ) : (
                                                <>%{inv.taxRate}</>
                                            )}
                                        </td>
                                        {!isReadOnly && (
                                            <td className="p-3 text-right whitespace-nowrap">
                                                <button onClick={() => startEdit(inv)} className="text-zinc-400 hover:text-indigo-600 mr-2 transition-colors" title="Düzenle">
                                                    <Pencil className="w-4 h-4 inline" />
                                                </button>
                                                <button onClick={() => removeInvoice(inv.id)} className="text-zinc-400 hover:text-red-600 transition-colors" title="Sil">
                                                    <Trash2 className="w-4 h-4 inline" />
                                                </button>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100">
                        <tr>
                            <td colSpan={4} className="p-3 text-right">Toplam Gider:</td>
                            <td className="p-3 text-right text-red-600 dark:text-red-400">
                                {formatCurrency(data.invoices.reduce((sum, i) => sum + i.amount, 0))}
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
                type={confirmModal.type}
            />
        </div>
    );
};

const SalesTab = ({ data, isReadOnly, onChange }: { data: MonthlyMonthData, isReadOnly: boolean, onChange: (d: MonthlyMonthData) => void }) => {
    // Local state for form
    const [newSale, setNewSale] = useState<Partial<DailySale>>({
        date: new Date().toISOString().slice(0, 10),
        cash: 0,
        creditCard: 0,
        mealCard: 0,
        yemeksepeti: 0,
        trendyol: 0,
        getirYemek: 0,
        migrosYemek: 0,
        totalAmount: 0
    });

    useEffect(() => {
        const total = (newSale.cash || 0) + (newSale.creditCard || 0) + (newSale.mealCard || 0) + (newSale.yemeksepeti || 0) + (newSale.trendyol || 0) + (newSale.getirYemek || 0) + (newSale.migrosYemek || 0);
        setNewSale(prev => ({ ...prev, totalAmount: total }));
    }, [newSale.cash, newSale.creditCard, newSale.mealCard, newSale.yemeksepeti, newSale.trendyol, newSale.getirYemek, newSale.migrosYemek]);

    const addSale = () => {
        if (!newSale.totalAmount) return alert('Toplam Tutar 0 olamaz.');

        const sale: DailySale = {
            id: Date.now().toString(),
            date: newSale.date || new Date().toISOString().slice(0, 10),
            cash: Number(newSale.cash) || 0,
            creditCard: Number(newSale.creditCard) || 0,
            mealCard: Number(newSale.mealCard) || 0,
            yemeksepeti: Number(newSale.yemeksepeti) || 0,
            trendyol: Number(newSale.trendyol) || 0,
            getirYemek: Number(newSale.getirYemek) || 0,
            migrosYemek: Number(newSale.migrosYemek) || 0,
            online: 0,
            totalAmount: newSale.totalAmount || 0,
            note: newSale.note || ''
        };

        const updatedSales = [...data.dailySales, sale];
        updatedSales.sort((a, b) => a.date.localeCompare(b.date));

        onChange({ ...data, dailySales: updatedSales });
        setNewSale({ ...newSale, cash: 0, creditCard: 0, mealCard: 0, yemeksepeti: 0, trendyol: 0, getirYemek: 0, migrosYemek: 0, totalAmount: 0 });
    };

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger' as 'danger' | 'warning'
    });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const removeSale = (id: string) => {
        if (isReadOnly) return;

        setConfirmModal({
            isOpen: true,
            title: 'Satış Kaydını Sil',
            message: 'Bu satış kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            type: 'danger',
            onConfirm: () => {
                const updatedSales = data.dailySales.filter(s => s.id !== id);
                onChange({ ...data, dailySales: updatedSales });
                closeConfirm();
            }
        });
    };

    // Inline Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<DailySale>>({});

    const startEdit = (sale: DailySale) => {
        setEditingId(sale.id);
        setEditForm({ ...sale });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = () => {
        if (!editingId) return;

        const updatedSales = data.dailySales.map(s => {
            if (s.id === editingId) {
                const total = (Number(editForm.cash) || 0) + (Number(editForm.creditCard) || 0) + (Number(editForm.mealCard) || 0) + (Number(editForm.yemeksepeti) || 0) + (Number(editForm.trendyol) || 0) + (Number(editForm.getirYemek) || 0) + (Number(editForm.migrosYemek) || 0);
                return { ...s, ...editForm, totalAmount: total } as DailySale;
            }
            return s;
        });

        onChange({ ...data, dailySales: updatedSales });
        setEditingId(null);
        setEditForm({});
    };

    return (
        <div className="space-y-6">
            {!isReadOnly && (
                <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Günlük Satış Ekle</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="col-span-2 lg:col-span-1">
                            <label className="text-xs text-zinc-500 mb-1 block">Tarih</label>
                            <input type="date" value={newSale.date} onChange={e => setNewSale({ ...newSale, date: e.target.value })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert" />
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Nakit</label>
                            <input type="number" placeholder="0.00" value={newSale.cash || ''} onChange={e => setNewSale({ ...newSale, cash: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Kredi Kartı</label>
                            <input type="number" placeholder="0.00" value={newSale.creditCard || ''} onChange={e => setNewSale({ ...newSale, creditCard: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Yemek Kartı (Sodexo/Multinet)</label>
                            <input type="number" placeholder="0.00" value={newSale.mealCard || ''} onChange={e => setNewSale({ ...newSale, mealCard: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>

                        <div>
                            <label className="text-xs text-orange-600 mb-1 block">Trendyol Yemek</label>
                            <input type="number" placeholder="0.00" value={newSale.trendyol || ''} onChange={e => setNewSale({ ...newSale, trendyol: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-orange-200 dark:border-orange-900/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <div>
                            <label className="text-xs text-red-600 mb-1 block">Yemeksepeti</label>
                            <input type="number" placeholder="0.00" value={newSale.yemeksepeti || ''} onChange={e => setNewSale({ ...newSale, yemeksepeti: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-red-200 dark:border-red-900/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <div>
                            <label className="text-xs text-purple-600 mb-1 block">GetirYemek</label>
                            <input type="number" placeholder="0.00" value={newSale.getirYemek || ''} onChange={e => setNewSale({ ...newSale, getirYemek: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-purple-200 dark:border-purple-900/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                        <div>
                            <label className="text-xs text-orange-500 mb-1 block">MigrosYemek</label>
                            <input type="number" placeholder="0.00" value={newSale.migrosYemek || ''} onChange={e => setNewSale({ ...newSale, migrosYemek: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-orange-200 dark:border-orange-900/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>

                        <div className="col-span-2 lg:col-span-4 mt-2">
                            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
                                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Toplam Günlük Ciro:</span>
                                <span className="font-bold text-xl text-green-600 dark:text-green-400">{formatCurrency(newSale.totalAmount || 0)}</span>
                                <button onClick={addSale} className="bg-indigo-600 text-white rounded px-6 py-2 text-sm font-medium hover:bg-indigo-700 ml-4">Ekle</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#18181b] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-medium">
                        <tr>
                            <th className="p-3">Tarih</th>
                            <th className="p-3 text-right">Nakit</th>
                            <th className="p-3 text-right">Kredi K.</th>
                            <th className="p-3 text-right">Yemek K.</th>
                            <th className="p-3 text-right text-orange-600">Trendyol</th>
                            <th className="p-3 text-right text-red-600">Yemeksepeti</th>
                            <th className="p-3 text-right text-purple-600">Getir</th>
                            <th className="p-3 text-right text-orange-500">Migros</th>
                            <th className="p-3 text-right font-bold bg-zinc-100 dark:bg-zinc-800/50">TOPLAM</th>
                            {!isReadOnly && <th className="p-3"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {data.dailySales.length === 0 && (
                            <tr><td colSpan={10} className="p-4 text-center text-zinc-500">Henüz satış girişi yapılmamış.</td></tr>
                        )}
                        {data.dailySales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                {editingId === sale.id ? (
                                    <>
                                        <td className="p-2"><input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="w-full bg-zinc-800 text-white px-2 py-1 rounded text-xs" /></td>
                                        <td className="p-2"><input type="number" value={editForm.cash} onChange={e => setEditForm({ ...editForm, cash: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.creditCard} onChange={e => setEditForm({ ...editForm, creditCard: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.mealCard} onChange={e => setEditForm({ ...editForm, mealCard: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.trendyol} onChange={e => setEditForm({ ...editForm, trendyol: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.yemeksepeti} onChange={e => setEditForm({ ...editForm, yemeksepeti: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.getirYemek} onChange={e => setEditForm({ ...editForm, getirYemek: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2"><input type="number" value={editForm.migrosYemek} onChange={e => setEditForm({ ...editForm, migrosYemek: e.target.valueAsNumber })} className="w-full bg-zinc-800 text-white text-right px-2 py-1 rounded text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                                        <td className="p-2 text-right font-bold text-white">
                                            {((editForm.cash || 0) + (editForm.creditCard || 0) + (editForm.mealCard || 0) + (editForm.yemeksepeti || 0) + (editForm.trendyol || 0) + (editForm.getirYemek || 0) + (editForm.migrosYemek || 0)).toFixed(2)}
                                        </td>
                                        <td className="p-2 flex items-center justify-end gap-1">
                                            <button onClick={saveEdit} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check size={16} /></button>
                                            <button onClick={cancelEdit} className="p-1 text-zinc-400 hover:bg-zinc-700 rounded"><X size={16} /></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-3">{formatDateTR(sale.date)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.cash)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.creditCard)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.mealCard)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.trendyol || 0)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.yemeksepeti || 0)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.getirYemek || 0)}</td>
                                        <td className="p-3 text-right text-zinc-600 dark:text-zinc-400">{formatCurrency(sale.migrosYemek || 0)}</td>
                                        <td className="p-3 text-right font-bold text-green-600 dark:text-green-400 bg-zinc-50 dark:bg-zinc-800/20">{formatCurrency(sale.totalAmount)}</td>
                                        {!isReadOnly && (
                                            <td className="p-3 text-right whitespace-nowrap">
                                                <button onClick={() => startEdit(sale)} className="text-zinc-400 hover:text-indigo-600 mr-2 transition-colors" title="Düzenle">
                                                    <Pencil className="w-4 h-4 inline" />
                                                </button>
                                                <button onClick={() => removeSale(sale.id)} className="text-zinc-400 hover:text-red-600 transition-colors" title="Sil">
                                                    <Trash2 className="w-4 h-4 inline" />
                                                </button>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100">
                        <tr>
                            <td className="p-3 text-right">Toplam:</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + s.cash, 0))}</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + s.creditCard, 0))}</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + s.mealCard, 0))}</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + (s.trendyol || 0), 0))}</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + (s.yemeksepeti || 0), 0))}</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + (s.getirYemek || 0), 0))}</td>
                            <td className="p-3 text-right">{formatCurrency(data.dailySales.reduce((sum, s) => sum + (s.migrosYemek || 0), 0))}</td>
                            <td className="p-3 text-right text-green-600 dark:text-green-400">
                                {formatCurrency(data.dailySales.reduce((sum, s) => sum + s.totalAmount, 0))}
                            </td>
                            {!isReadOnly && <td></td>}
                        </tr>
                    </tfoot>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
                type={confirmModal.type}
            />
        </div>
    );
};

// Modern Month Selector Component
const MonthSelector = ({ selectedMonth, onChange, closings }: { selectedMonth: string, onChange: (m: string) => void, closings: MonthlyMonthData[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(Number(selectedMonth.split('-')[0]));
    const containerRef = useRef<HTMLDivElement>(null);

    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const handlePrevMonth = () => {
        let [y, m] = selectedMonth.split('-').map(Number);
        m--;
        if (m === 0) {
            m = 12;
            y--;
        }
        onChange(`${y}-${String(m).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        let [y, m] = selectedMonth.split('-').map(Number);
        m++;
        if (m === 13) {
            m = 1;
            y++;
        }
        onChange(`${y}-${String(m).padStart(2, '0')}`);
    };


    const isMonthClosed = (year: number, monthIdx: number) => {
        const mStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
        return closings.find(c => c.monthStr === mStr)?.isClosed;
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const displayMonth = months[Number(selectedMonth.split('-')[1]) - 1];
    const displayYear = selectedMonth.split('-')[0];

    return (
        <div className="flex items-center gap-2" ref={containerRef}>
            {/* Quick Navigation - Prev */}
            <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                title="Önceki Ay"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Main Selector Card */}
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center gap-4 px-5 py-2.5 
                        bg-white dark:bg-zinc-900 border 
                        ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 shadow-sm'}
                        rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-zinc-700 
                        transition-all duration-300 min-w-[220px] group
                    `}
                >
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-0.5">DÖNEM</span>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {displayMonth} {displayYear}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Dropdown Grid */}
                {isOpen && (
                    <div className="absolute right-0 top-full mt-3 w-[320px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Year Header */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800">
                            <button
                                onClick={() => setViewYear(v => v - 1)}
                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-zinc-500" />
                            </button>
                            <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {viewYear}
                            </span>
                            <button
                                onClick={() => setViewYear(v => v + 1)}
                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>

                        {/* Month Grid */}
                        <div className="p-3 grid grid-cols-3 gap-2">
                            {months.map((m, idx) => {
                                const mStr = `${viewYear}-${String(idx + 1).padStart(2, '0')}`;
                                const isSelected = selectedMonth === mStr;
                                const isClosed = isMonthClosed(viewYear, idx);

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onChange(mStr);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            relative py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200
                                            flex flex-col items-center justify-center gap-1
                                            ${isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105 z-10'
                                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
                                        `}
                                    >
                                        {m}
                                        {isClosed && (
                                            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'} shadow-sm`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer Info */}
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">KAPALI DÖNEM</span>
                            </div>
                            <button
                                onClick={() => {
                                    const now = new Date();
                                    onChange(now.toISOString().slice(0, 7));
                                    setViewYear(now.getFullYear());
                                    setIsOpen(false);
                                }}
                                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                            >
                                BUGÜNÜ SEÇ
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Navigation - Next */}
            <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                title="Sonraki Ay"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};



