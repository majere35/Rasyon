
import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { MonthlyMonthData, Invoice, DailySale } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { MonthlyBalanceTab } from '../components/MonthlyBalanceTab';
import { ConfirmModal } from '../components/ConfirmModal';
import { Loader2, Plus, Lock, Unlock, FileText, CheckCircle, AlertCircle, Pencil, Trash2, ChevronDown, History, Check } from 'lucide-react';

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
                        <button
                            onClick={handleUnlock}
                            disabled={saving || loading}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Unlock className="w-4 h-4" />
                            Düzenle (Kilidi Aç)
                        </button>
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
        </div>
    );
};

// --- Sub-Components ---

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

    const categories = ["Gıda", "Ambalaj", "Enerji", "Vergi/Stopaj", "Personel", "Kira", "Bakım/Onarım", "Kurye", "Diğer"];

    const addInvoice = () => {
        if (!newInvoice.supplier || !newInvoice.amount) return alert('Tedarikçi ve Tutar zorunludur.');

        const invoice: Invoice = {
            id: Date.now().toString(),
            date: newInvoice.date || new Date().toISOString().slice(0, 10),
            supplier: newInvoice.supplier,
            description: newInvoice.description || '',
            category: newInvoice.category || 'Diğer',
            amount: Number(newInvoice.amount),
            taxRate: Number(newInvoice.taxRate),
            status: newInvoice.status as 'paid' | 'pending' || 'paid',
            paymentDate: newInvoice.paymentDate,
            taxMethod: newInvoice.category === 'Kira' ? (newInvoice.taxMethod || 'stopaj') : undefined
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
                    taxMethod: editForm.category === 'Kira' ? (editForm.taxMethod || 'stopaj') : undefined
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
                                value={newInvoice.category || 'Diğer'}
                                onChange={v => setNewInvoice({ ...newInvoice, category: v })}
                                options={categories.map(c => ({ label: c, value: c }))}
                            />
                        </div>
                        <input type="number" placeholder="Tutar" value={newInvoice.amount || ''} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.valueAsNumber })} className="p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm lg:w-[100px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />

                        {/* Rent Specific: Tax Method Selector */}
                        {newInvoice.category === 'Kira' && (
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
                                            <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full p-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700">
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2"><input type="text" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700" /></td>
                                        <td className="p-2"><input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.valueAsNumber })} className="w-full p-1 border rounded text-right bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700" /></td>
                                        <td className="p-2">
                                            <select value={editForm.taxRate} onChange={e => setEditForm({ ...editForm, taxRate: Number(e.target.value) })} className="w-full p-1 border rounded bg-transparent text-zinc-900 dark:text-zinc-100 dark:border-zinc-700">
                                                <option value={0}>%0</option>
                                                <option value={1}>%1</option>
                                                <option value={10}>%10</option>
                                                <option value={20}>%20</option>
                                            </select>
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
                                        <td className="p-3 text-xs text-zinc-500 opacity-70">{inv.category}</td>
                                        <td className="p-3 text-zinc-500 truncate max-w-[200px]">{inv.description}</td>
                                        <td className="p-3 text-right font-medium text-red-600 dark:text-red-400">{formatCurrency(inv.amount)}</td>
                                        <td className="p-3 text-right text-zinc-500">
                                            {inv.category === 'Kira' && inv.taxMethod === 'stopaj' ? (
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

        // Check if date already exists? Maybe warn or allow multiple entries? Allowing multiple for now.

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
            online: 0, // Legacy support, handled via specific fields
            totalAmount: newSale.totalAmount || 0,
            note: newSale.note || ''
        };

        const updatedSales = [...data.dailySales, sale];
        // Sort by date
        updatedSales.sort((a, b) => a.date.localeCompare(b.date));

        onChange({ ...data, dailySales: updatedSales });
        // Reset form
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

    return (
        <div className="space-y-6">
            {!isReadOnly && (
                <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    {/* ... form inputs ... */}
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Günlük Satış Ekle</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="col-span-2 lg:col-span-1">
                            <label className="text-xs text-zinc-500 mb-1 block">Tarih</label>
                            <input type="date" value={newSale.date} onChange={e => setNewSale({ ...newSale, date: e.target.value })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert" />
                        </div>

                        {/* Offline Channels */}
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Nakit</label>
                            <input type="number" placeholder="0.00" value={newSale.cash || ''} onChange={e => setNewSale({ ...newSale, cash: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Kredi Kartı</label>
                            <input type="number" placeholder="0.00" value={newSale.creditCard || ''} onChange={e => setNewSale({ ...newSale, creditCard: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Yemek Kartı (Sodexo/Multinet)</label>
                            <input type="number" placeholder="0.00" value={newSale.mealCard || ''} onChange={e => setNewSale({ ...newSale, mealCard: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm" />
                        </div>

                        {/* Online Channels */}
                        <div>
                            <label className="text-xs text-orange-600 mb-1 block">Trendyol Yemek</label>
                            <input type="number" placeholder="0.00" value={newSale.trendyol || ''} onChange={e => setNewSale({ ...newSale, trendyol: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-orange-200 dark:border-orange-900/50" />
                        </div>
                        <div>
                            <label className="text-xs text-red-600 mb-1 block">Yemeksepeti</label>
                            <input type="number" placeholder="0.00" value={newSale.yemeksepeti || ''} onChange={e => setNewSale({ ...newSale, yemeksepeti: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-red-200 dark:border-red-900/50" />
                        </div>
                        <div>
                            <label className="text-xs text-purple-600 mb-1 block">GetirYemek</label>
                            <input type="number" placeholder="0.00" value={newSale.getirYemek || ''} onChange={e => setNewSale({ ...newSale, getirYemek: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-purple-200 dark:border-purple-900/50" />
                        </div>
                        <div>
                            <label className="text-xs text-orange-500 mb-1 block">MigrosYemek</label>
                            <input type="number" placeholder="0.00" value={newSale.migrosYemek || ''} onChange={e => setNewSale({ ...newSale, migrosYemek: e.target.valueAsNumber })} className="w-full p-2 rounded border dark:bg-zinc-800 dark:border-zinc-700 text-sm border-orange-200 dark:border-orange-900/50" />
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
                    {/* ... table content ... */}
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
                                    <td className="p-3 text-right">
                                        <button onClick={() => removeSale(sale.id)} className="text-red-500 hover:text-red-700 text-xs ml-2">Sil</button>
                                    </td>
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

// Custom Month Selector Component (Styled to match CustomSelect)
const MonthSelector = ({ selectedMonth, onChange, closings }: { selectedMonth: string, onChange: (m: string) => void, closings: MonthlyMonthData[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate easy text for month
    const getMonthText = (m: string) => {
        const [y, mo] = m.split('-');
        const date = new Date(Number(y), Number(mo) - 1);
        return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
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

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button - Matches CustomSelect style */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-sm min-w-[200px]"
            >
                <div>
                    <span className="block text-[10px] text-zinc-500 text-left uppercase tracking-wider font-semibold">SEÇİLİ DÖNEM</span>
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {getMonthText(selectedMonth)}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                        <label className="text-xs text-zinc-500 mb-1 block">Farklı Bir Ay Seç</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => { onChange(e.target.value); setIsOpen(false); }}
                            className="w-full p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        <p className="text-xs font-medium text-zinc-400 px-2 py-1">GEÇMİŞ RAPORLAR</p>
                        {closings.length === 0 && <p className="text-sm text-zinc-500 px-2">Henüz kapatılmış dönem yok.</p>}
                        {closings
                            .sort((a, b) => b.monthStr.localeCompare(a.monthStr))
                            .map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => { onChange(m.monthStr); setIsOpen(false); }}
                                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${selectedMonth === m.monthStr ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${m.isClosed ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {m.isClosed ? <CheckCircle className="w-4 h-4" /> : <History className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{getMonthText(m.monthStr)}</p>
                                            <p className="text-xs text-zinc-500">{m.isClosed ? 'Kapanış Yapıldı' : 'Aktif'}</p>
                                        </div>
                                    </div>
                                    {selectedMonth === m.monthStr && <Check className="w-4 h-4 text-indigo-600" />}
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};


