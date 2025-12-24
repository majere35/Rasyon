import { useState } from 'react';
import { Trash2, TrendingUp, Calendar, Plus, X, Building2, Factory, Truck, Users, PenLine } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, getNetPrice } from '../lib/utils';
import { NumberInput } from '../components/NumberInput';
import { TaxSummary } from '../components/TaxSummary';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Expense } from '../types';

const EXPENSE_GROUPS = [
    {
        id: 'general',
        title: 'GENEL YÖNETİM',
        icon: Building2,
        color: 'text-blue-400',
        borderColor: 'border-blue-500/20',
        bgGradient: 'from-blue-500/5 to-transparent'
    },
    {
        id: 'production',
        title: 'ÜRETİM GİDERLERİ',
        icon: Factory,
        color: 'text-orange-400',
        borderColor: 'border-orange-500/20',
        bgGradient: 'from-orange-500/5 to-transparent'
    },
    {
        id: 'sales',
        title: 'SATIŞ & DAĞITIM',
        icon: Truck,
        color: 'text-purple-400',
        borderColor: 'border-purple-500/20',
        bgGradient: 'from-purple-500/5 to-transparent'
    },
    {
        id: 'personnel',
        title: 'PERSONEL',
        icon: Users,
        color: 'text-green-400',
        borderColor: 'border-green-500/20',
        bgGradient: 'from-green-500/5 to-transparent'
    }
];

export function BalanceView() {
    const {
        recipes,
        salesTargets,
        expenses,
        addExpense,
        removeExpense,
        updateExpense,
        daysWorkedInMonth,
        setDaysWorked,
        company,
        toggleConfig,
        rawIngredients
    } = useStore();

    // --- State ---
    const [addingGroup, setAddingGroup] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editField, setEditField] = useState<'name' | 'amount' | 'autoValue' | null>(null);
    const [tempValue, setTempValue] = useState('');
    const [openVatDropdownId, setOpenVatDropdownId] = useState<string | null>(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger' as 'danger' | 'warning'
    });

    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const handleDeleteClick = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Gideri Sil',
            message: 'Bu gider kalemini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            type: 'danger',
            onConfirm: () => {
                removeExpense(id);
                closeConfirm();
            }
        });
    };

    // --- Core Calculations ---
    // Revenue uses NET prices (KDV Hariç) since calculatedPrice is KDV Dahil
    const totalDailyRevenue = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        if (!recipe) return sum;
        const totalQty = (target.dailyTarget || 0) + (target.packageDailyTarget || 0);
        const netPrice = getNetPrice(recipe.calculatedPrice);
        return sum + (netPrice * totalQty);
    }, 0);
    const monthlyRevenue = totalDailyRevenue * daysWorkedInMonth;

    const totalDailyItems = salesTargets.reduce((sum, target) => {
        return sum + (target.dailyTarget || 0) + (target.packageDailyTarget || 0);
    }, 0);
    const monthlyItems = totalDailyItems * daysWorkedInMonth;

    const totalDailyIngredientsCost = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        if (!recipe) return sum;
        const totalQty = (target.dailyTarget || 0) + (target.packageDailyTarget || 0);
        return sum + (recipe.totalCost * totalQty);
    }, 0);
    const monthlyIngredientsCost = totalDailyIngredientsCost * daysWorkedInMonth;

    const { packagingCosts } = useStore();
    const packagingUnitCost = packagingCosts.reduce((sum, p) => sum + p.amount, 0);

    // Fix: Only apply packaging cost to PACKAGE items
    const totalDailyPackageItems = salesTargets.reduce((sum, target) => sum + (target.packageDailyTarget || 0), 0);
    const monthlyPackageItems = totalDailyPackageItems * daysWorkedInMonth;
    const monthlyPackagingCost = monthlyPackageItems * packagingUnitCost;

    // --- Calculate Ingredient VAT based on RawIngredient vatRate ---
    const totalDailyIngredientsVat = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        if (!recipe) return sum;
        const totalQty = (target.dailyTarget || 0) + (target.packageDailyTarget || 0);

        // For each ingredient in the recipe, find its rawIngredient and use its vatRate
        const recipeIngredientsVat = recipe.ingredients.reduce((vatSum, ingredient) => {
            if (!ingredient.rawIngredientId) return vatSum;
            const rawIng = rawIngredients.find(ri => ri.id === ingredient.rawIngredientId);
            const vatRate = rawIng?.vatRate ?? 0.01; // Default %1 for food
            const ingredientCost = ingredient.quantity * ingredient.price;
            return vatSum + (ingredientCost * vatRate);
        }, 0);

        return sum + (recipeIngredientsVat * totalQty);
    }, 0);
    const monthlyIngredientsVat = totalDailyIngredientsVat * daysWorkedInMonth;



    // --- Helper: Get Calculated Amount for Expense ---
    const getCalculatedAmount = (expense: Expense): number => {
        if (!expense.isAutomated) {
            // Special Logic for Rent (Stopaj)
            // If Stopaj is selected, the input amount is NET.
            // We need to gross it up for the "Expense" column because tax is also an expense.
            // Gross = Net / 0.8
            // Fix: Use includes() to handle cases like "Kira " or "Dükkan Kirası"
            if (expense.name.toLowerCase().includes('kira') && expense.taxMethod === 'stopaj') {
                return expense.amount / 0.8;
            }
            return expense.amount;
        }

        switch (expense.autoType) {
            case 'food_cost':
                return monthlyIngredientsCost;
            case 'packaging':
                return monthlyPackagingCost;
            case 'percentage':
                return monthlyRevenue * ((expense.autoValue || 0) / 100);
            case 'courier':
                return monthlyItems * ((expense.autoValue || 70) / 100) * expense.amount;
            default:
                return expense.amount;
        }
    };

    const getExpenseVat = (expense: Expense): number => {
        const amt = getCalculatedAmount(expense);

        // User has full control via VAT selector.
        // No more smart defaults or automatic overrides.
        // If undefined, default to 20% (standard VAT).
        return amt * (expense.vatRate !== undefined ? expense.vatRate : 0.20);
    };

    // --- Totals ---
    const allExpensesWithCalc = expenses.map(e => ({
        ...e,
        finalAmount: getCalculatedAmount(e),
        finalVat: getExpenseVat(e)
    }));

    const totalExpenses = allExpensesWithCalc.reduce((sum, e) => sum + e.finalAmount, 0);
    const totalExpensesVat = allExpensesWithCalc.reduce((sum, e) => sum + e.finalVat, 0) + monthlyIngredientsVat;
    const netProfit = monthlyRevenue - totalExpenses;

    // --- Stopaj Calculation for Summary ---
    // We need to tell the user how much Stopaj they will pay.
    // Stopaj = Gross - Net. Or Gross * 0.20.
    const totalStopaj = allExpensesWithCalc
        .filter(e => e.name.toLowerCase() === 'kira' && e.taxMethod === 'stopaj')
        .reduce((sum, e) => sum + (e.finalAmount * 0.20), 0);


    // --- Tax Logic (Replicated for 'True Net') ---
    const incomeVat = monthlyRevenue * 0.10;
    const vatDiff = incomeVat - totalExpensesVat;
    const payableVat = vatDiff > 0 ? vatDiff : 0;

    // Calculate Income Tax
    let incomeTax = 0;
    // Explicit check to satisfy TS
    const companyType = company?.type;

    if (companyType === 'limited') {
        // Corporate Tax: 25% of Net Profit
        const taxableIncome = Math.max(0, netProfit);
        incomeTax = taxableIncome * 0.25;
    } else {
        // Şahıs Progressive
        const annualProfit = netProfit * 12;
        let annualTax = 0;
        // Use a safe positive profit base
        const base = Math.max(0, annualProfit);

        if (base <= 158000) annualTax = base * 0.15;
        else if (base <= 330000) annualTax = 23700 + (base - 158000) * 0.20;
        else if (base <= 800000) annualTax = 58100 + (base - 330000) * 0.27;
        else if (base <= 4300000) annualTax = 185000 + (base - 800000) * 0.35;
        else annualTax = 1410000 + (base - 4300000) * 0.40;

        incomeTax = annualTax / 12;
    }

    // TRUE NET: "Her şey ödendikten sonra elimize ne kalıyor"
    const trueNetCash = netProfit - incomeTax - payableVat - totalStopaj;


    // --- Actions ---
    const startEditing = (expense: Expense, field: 'name' | 'amount' | 'autoValue') => {
        setEditingId(expense.id);
        setEditField(field);

        let val = '';
        if (field === 'name') val = expense.name;
        if (field === 'amount') val = expense.amount.toString();
        if (field === 'autoValue') val = (expense.autoValue || 0).toString();
        setTempValue(val);
    };

    const saveEdit = (expense: Expense) => {
        if (!editField) return;

        const updates: Partial<Expense> = {};
        if (editField === 'name') updates.name = tempValue;

        if (editField === 'amount') {
            const num = parseFloat(tempValue);
            if (!isNaN(num)) updates.amount = num;
        }

        if (editField === 'autoValue') {
            const num = parseFloat(tempValue);
            if (!isNaN(num)) updates.autoValue = num;
        }

        updateExpense(expense.id, { ...expense, ...updates });
        setEditingId(null);
        setEditField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, expense: Expense, currentIndex: number) => {
        if (e.key === 'Enter') {
            saveEdit(expense);

            // Excel-like Navigation: Move focus to the amount input of the next row
            // We use data-index attributes
            const nextIndex = currentIndex + 1;
            setTimeout(() => {
                const nextInput = document.querySelector(`span[data-amount-index="${nextIndex}"]`) as HTMLElement;
                if (nextInput) {
                    nextInput.click(); // Trigger startEditing
                }
            }, 50); // Small delay to allow react state to settle
        }
    };

    const handleAdd = (groupId: string) => {
        if (!newName || !newAmount) return;
        const amt = parseFloat(newAmount);
        if (isNaN(amt)) return;

        addExpense({
            id: crypto.randomUUID(),
            name: newName,
            amount: amt,
            category: 'fixed',
            group: groupId as any,
            vatRate: 0.20 // Default 20%
        });
        setNewName('');
        setNewAmount('');
    };

    // Flatten expensesList for indexing
    let globalRowIndex = 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Aylık Bilanço</h2>
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                        <span>Genel finansal durum ve kâr/zarar analizi.</span>
                        <span className="text-orange-400 ml-2 text-xs bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                            (Tüm giderlerinizi KDV hariç olarak girin.)
                        </span>
                    </p>
                    {company && (
                        <div
                            className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full cursor-pointer hover:bg-indigo-500/20 transition-colors"
                            onClick={() => toggleConfig(true)}
                            title="Bilgileri Düzenle"
                        >
                            <Building2 size={12} className="text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-300">
                                {company.officialName}
                                <span className="text-zinc-500 mx-1">|</span>
                                <span className="text-white">{company.name}</span>
                            </span>
                            <PenLine size={10} className="text-indigo-500 ml-1" />
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center gap-4">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Çalışma Günü</div>
                        <NumberInput
                            value={daysWorkedInMonth}
                            onChange={(val) => setDaysWorked(val || 0)}
                            className="bg-transparent text-lg font-bold text-white w-16 focus:outline-none border-b border-zinc-700 focus:border-indigo-500 transition-colors text-center"
                            min={0}
                            max={31}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* LEFT: Expenses (8 Cols) */}
                <div className="xl:col-span-8 space-y-6">
                    {EXPENSE_GROUPS.map((group) => {
                        const groupExpenses = allExpensesWithCalc.filter(e => e.group === group.id);
                        const groupTotal = groupExpenses.reduce((sum, e) => sum + e.finalAmount, 0);
                        const groupRevenueShare = monthlyRevenue > 0 ? (groupTotal / monthlyRevenue) * 100 : 0;

                        return (
                            <div key={group.id} className={`bg-zinc-900/40 border ${group.borderColor} rounded-xl overflow-visible`}>
                                {/* Group Header */}
                                <div className={`px-3 py-1.5 border-b ${group.borderColor} flex justify-between items-center bg-gradient-to-r ${group.bgGradient}`}>
                                    <h3 className={`font-bold ${group.color} text-sm flex items-center gap-2`}>
                                        <group.icon size={16} />
                                        {group.title}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900/50 px-1.5 rounded">
                                            %{groupRevenueShare.toFixed(1)} Ciro
                                        </span>
                                        <span className="font-mono text-zinc-400 text-sm font-medium">
                                            -{formatCurrency(groupTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-1">
                                    {groupExpenses.map((expense) => {
                                        const currentIndex = globalRowIndex++; // Increment for each row
                                        const expenseRevenueShare = monthlyRevenue > 0 ? (expense.finalAmount / monthlyRevenue) * 100 : 0;

                                        return (
                                            <div key={expense.id} className="flex items-center text-sm py-0.5 px-2 hover:bg-zinc-800/30 rounded group transition-colors min-h-[28px]">

                                                {/* Name / Parameter Column */}
                                                <div className="flex-1 flex items-center gap-2">
                                                    {/* Percentage & Courier Inputs (0.1 steps) */}
                                                    {/* Percentage Input (Only for Percentage Type) */}
                                                    {expense.autoType === 'percentage' && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-zinc-300">{expense.name}</span>

                                                            {editingId === expense.id && editField === 'autoValue' ? (
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    step="0.1"
                                                                    className="w-16 bg-zinc-800 border border-indigo-500 rounded px-1 text-center font-bold text-white text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    value={tempValue}
                                                                    onChange={e => setTempValue(e.target.value)}
                                                                    onBlur={() => saveEdit(expense)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                                    onFocus={(e) => e.target.select()}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-500/20"
                                                                    onClick={() => startEditing(expense, 'autoValue')}
                                                                >
                                                                    %{expense.autoValue}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Courier Cost Display */}
                                                    {expense.autoType === 'courier' && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-zinc-300">{expense.name}</span>

                                                            {/* Percentage Input for Courier */}
                                                            {editingId === expense.id && editField === 'autoValue' ? (
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    step="1"
                                                                    className="w-16 bg-zinc-800 border border-indigo-500 rounded px-1 text-center font-bold text-white text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    value={tempValue}
                                                                    onChange={e => setTempValue(e.target.value)}
                                                                    onBlur={() => saveEdit(expense)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                                    onFocus={(e) => e.target.select()}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-500/20"
                                                                    onClick={() => startEditing(expense, 'autoValue')}
                                                                >
                                                                    %{expense.autoValue || 70}
                                                                </span>
                                                            )}

                                                            <span className="text-zinc-600 text-xs">x</span>

                                                            {editingId === expense.id && editField === 'amount' ? (
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    className="w-16 bg-zinc-800 border border-indigo-500 rounded px-1 text-right font-mono text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    value={tempValue}
                                                                    onChange={e => setTempValue(e.target.value)}
                                                                    onBlur={() => saveEdit(expense)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                                    onFocus={(e) => e.target.select()}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-xs text-zinc-500 cursor-pointer hover:text-white border-b border-dashed border-zinc-700 hover:border-zinc-500"
                                                                    onClick={() => startEditing(expense, 'amount')}
                                                                >
                                                                    {formatCurrency(expense.amount).replace('₺', '')} ₺/pkt
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Standard Name (If not percentage or courier) */}
                                                    {!(expense.autoType === 'percentage' || expense.autoType === 'courier') && (
                                                        editingId === expense.id && editField === 'name' ? (
                                                            <input
                                                                autoFocus
                                                                className="bg-zinc-800 text-white px-2 py-0.5 rounded border border-indigo-500 outline-none w-full"
                                                                value={tempValue}
                                                                onChange={e => setTempValue(e.target.value)}
                                                                onBlur={() => saveEdit(expense)}
                                                                onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                                onFocus={(e) => e.target.select()}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`text-zinc-300 ${!expense.isAutomated ? 'cursor-pointer hover:text-white' : ''} truncate`}
                                                                    onClick={() => !expense.isAutomated && startEditing(expense, 'name')}
                                                                >
                                                                    {expense.name}

                                                                    {/* Show % Share for Food & Packaging */}
                                                                    {(expense.autoType === 'food_cost' || expense.autoType === 'packaging') && (
                                                                        <>
                                                                            <span className="ml-2 text-[10px] text-zinc-500 bg-zinc-900/50 px-1 rounded">
                                                                                %{expenseRevenueShare.toFixed(1)}
                                                                            </span>
                                                                            <span className="ml-2 text-[10px] text-orange-400 font-bold tracking-wider opacity-80">
                                                                                (OTOMATİK HESAPLANIR)
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </span>

                                                                {/* RENT TAX SWITCH */}
                                                                {expense.name.toLowerCase() === 'kira' && (
                                                                    <div className="flex items-center gap-2 ml-8">
                                                                        {/* Toggle Switch */}
                                                                        <div
                                                                            onClick={() => {
                                                                                const newMethod = expense.taxMethod === 'stopaj' ? 'kdv' : 'stopaj';
                                                                                updateExpense(expense.id, {
                                                                                    ...expense,
                                                                                    taxMethod: newMethod,
                                                                                    vatRate: newMethod === 'kdv' ? 0.20 : 0
                                                                                });
                                                                            }}
                                                                            className={`relative inline-flex h-5 w-[76px] items-center rounded-full transition-colors cursor-pointer border border-transparent ${expense.taxMethod === 'stopaj' ? 'bg-orange-500/20 ring-1 ring-orange-500/50' : 'bg-indigo-500/20 ring-1 ring-indigo-500/50'}`}
                                                                        >
                                                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${expense.taxMethod === 'stopaj' ? 'translate-x-[58px] bg-orange-400' : 'translate-x-1 bg-indigo-400'}`} />
                                                                            <span className={`absolute text-[9px] font-bold ${expense.taxMethod === 'stopaj' ? 'left-3 text-zinc-500' : 'right-3 text-zinc-500'}`}>
                                                                                {expense.taxMethod === 'stopaj' ? 'STOPAJ' : 'KDV'}
                                                                            </span>
                                                                        </div>

                                                                        {expense.taxMethod === 'stopaj' && (
                                                                            <span className="text-[10px] text-zinc-600">
                                                                                (Brüt: {formatCurrency(getCalculatedAmount(expense))})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>


                                                {/* VAT Selector (Hidden for Rent) */}
                                                {expense.name.toLowerCase() !== 'kira' && (
                                                    <div className="relative mr-3">
                                                        <div
                                                            className="px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 flex items-center gap-1"
                                                            onClick={() => setOpenVatDropdownId(openVatDropdownId === expense.id ? null : expense.id)}
                                                            title="KDV Oranını Değiştir"
                                                        >
                                                            %{((expense.vatRate !== undefined ? expense.vatRate : 0.20) * 100).toFixed(0)}
                                                        </div>

                                                        {/* Dropdown Menu */}
                                                        {openVatDropdownId === expense.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenVatDropdownId(null)}
                                                                />
                                                                <div className="absolute top-full right-0 mt-1 w-20 bg-zinc-950 border border-zinc-800 rounded shadow-xl z-50 overflow-hidden">
                                                                    {[0, 0.01, 0.10, 0.20].map((rate) => (
                                                                        <div
                                                                            key={rate}
                                                                            className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-800 ${expense.vatRate === rate ? 'text-white font-bold' : 'text-zinc-400'}`}
                                                                            onClick={() => {
                                                                                updateExpense(expense.id, { ...expense, vatRate: rate });
                                                                                setOpenVatDropdownId(null);
                                                                            }}
                                                                        >
                                                                            %{rate * 100}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Amount Column - Navigable */}
                                                <div className="flex items-center gap-4">
                                                    {editingId === expense.id && editField === 'amount' && !expense.isAutomated && expense.autoType !== 'courier' ? (
                                                        <div className="relative">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                className="w-24 bg-zinc-800 text-white text-right px-2 py-0.5 rounded border border-indigo-500 outline-none font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                value={tempValue}
                                                                onChange={e => setTempValue(e.target.value)}
                                                                onBlur={() => saveEdit(expense)}
                                                                onKeyDown={(e) => handleKeyDown(e, expense, currentIndex)}
                                                                onFocus={(e) => e.target.select()}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span
                                                            data-amount-index={currentIndex}
                                                            className={`font-mono text-sm w-24 text-right ${!expense.isAutomated ? 'text-zinc-300 cursor-pointer hover:text-white border-b border-transparent hover:border-zinc-500' : 'text-zinc-500'}`}
                                                            onClick={() => !expense.isAutomated && startEditing(expense, 'amount')}
                                                        >
                                                            -{formatCurrency(expense.finalAmount)}
                                                        </span>
                                                    )}

                                                    {/* Delete */}
                                                    <div className="w-6 flex justify-end">
                                                        {!expense.isAutomated && (
                                                            <button
                                                                onClick={() => handleDeleteClick(expense.id)}
                                                                className="text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Inline Add */}
                                    {addingGroup === group.id ? (
                                        <div className="flex items-center gap-2 p-2 bg-zinc-800/50 mt-1 rounded text-sm animate-in fade-in">
                                            <input
                                                autoFocus
                                                placeholder="Yeni Gider Adı"
                                                className="flex-1 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-white focus:border-indigo-500 outline-none"
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAdd(group.id)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-24 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-white text-right font-mono focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={newAmount}
                                                onChange={e => setNewAmount(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAdd(group.id)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <button onClick={() => setAddingGroup(null)} className="p-1 hover:bg-zinc-800 rounded"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingGroup(group.id)}
                                            className="w-full mt-1 py-0.5 flex items-center justify-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 rounded border border-dashed border-zinc-800 hover:border-zinc-700 transition-all"
                                        >
                                            <Plus size={10} /> Satır Ekle
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* RIGHT: Tax & Financial Summary (4 Cols) - SWAPPED ORDER */}
                <div className="xl:col-span-4 space-y-6">

                    {/* Tax Module Removed - Moved to MonthlyBalanceTab */}

                    {/* Tax Summary Module */}
                    <TaxSummary
                        profit={netProfit}
                        revenue={monthlyRevenue}
                        expensesVat={totalExpensesVat}
                        stopaj={totalStopaj}
                    />

                    {/* Main Profit Card (Moved Down & Expanded) */}
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative">
                            <TrendingUp className="text-green-500" />
                            Finansal Özet
                        </h3>

                        <div className="space-y-3 relative">
                            <div className="flex justify-between items-baseline mb-4">
                                <span className="text-zinc-400">Tahmini Aylık Ciro</span>
                                <span className="text-green-400 font-bold font-mono text-2xl">{formatCurrency(monthlyRevenue)}</span>
                            </div>

                            {/* Expense Breakdown */}
                            <div className="space-y-1 py-2 border-t border-zinc-800/30">
                                {EXPENSE_GROUPS.map(group => {
                                    const groupExpenses = allExpensesWithCalc.filter(e => e.group === group.id);
                                    const groupTotal = groupExpenses.reduce((sum, e) => sum + e.finalAmount, 0);
                                    // Calculate percentage of revenue
                                    const percentage = monthlyRevenue > 0 ? (groupTotal / monthlyRevenue) * 100 : 0;

                                    return (
                                        <div key={group.id} className="flex justify-between text-sm">
                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                <group.icon size={12} className={group.color} />
                                                <span>
                                                    {group.title}
                                                    <span className="text-zinc-600 text-xs ml-1">
                                                        (%{percentage.toFixed(1)})
                                                    </span>
                                                </span>
                                            </div>
                                            <span className="text-zinc-300 font-mono">-{formatCurrency(groupTotal)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-1 text-sm border-t border-zinc-800/50 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Net Kâr (Vergi Öncesi)</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${netProfit >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            %{monthlyRevenue > 0 ? ((netProfit / monthlyRevenue) * 100).toFixed(1) : '0.0'}
                                        </span>
                                        <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                                            {formatCurrency(netProfit)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-red-400 border-t border-zinc-800/50 pt-2 mt-2">
                                    <span className="">Ödenecek Toplam Vergi</span>
                                    <span className="font-mono">-{formatCurrency(incomeTax + payableVat + totalStopaj)}</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-zinc-700/50">
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-sm font-bold text-zinc-400">Vergi Sonrası Net Kâr</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trueNetCash >= 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
                                            %{monthlyRevenue > 0 ? ((trueNetCash / monthlyRevenue) * 100).toFixed(1) : '0.0'}
                                        </span>
                                        <div className={`text-3xl font-bold font-mono ${trueNetCash >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>
                                            {formatCurrency(trueNetCash)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">Vergiler ve KDV ödendikten sonra kalan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
                type={confirmModal.type}
            />
        </div >
    );
}
