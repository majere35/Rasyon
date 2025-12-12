import { useState } from 'react';
import { Trash2, TrendingUp, Calendar, Plus, X, Building2, Factory, Truck, Users, PenLine } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TaxSummary } from '../components/TaxSummary';
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
        toggleConfig
    } = useStore();

    // --- State ---
    const [addingGroup, setAddingGroup] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editField, setEditField] = useState<'name' | 'amount' | 'autoValue' | null>(null);
    const [tempValue, setTempValue] = useState('');

    // --- Core Calculations ---
    const totalDailyRevenue = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        return sum + (recipe ? recipe.calculatedPrice * target.dailyTarget : 0);
    }, 0);
    const monthlyRevenue = totalDailyRevenue * daysWorkedInMonth;

    const totalDailyItems = salesTargets.reduce((sum, target) => sum + target.dailyTarget, 0);
    const monthlyItems = totalDailyItems * daysWorkedInMonth;

    const totalDailyIngredientsCost = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        return sum + (recipe ? recipe.totalCost * target.dailyTarget : 0);
    }, 0);
    const monthlyIngredientsCost = totalDailyIngredientsCost * daysWorkedInMonth;

    const { packagingCosts } = useStore();
    const packagingUnitCost = packagingCosts.reduce((sum, p) => sum + p.amount, 0);
    const monthlyPackagingCost = monthlyItems * packagingUnitCost;


    // --- Helper: Get Calculated Amount for Expense ---
    const getCalculatedAmount = (expense: Expense): number => {
        if (!expense.isAutomated) return expense.amount;

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

        // Smart Defaults if vatRate is missing or generic
        if (expense.autoType === 'food_cost') return amt * 0.01; // %1 for Food

        return amt * (expense.vatRate !== undefined ? expense.vatRate : 0.20);
    };

    // --- Totals ---
    const allExpensesWithCalc = expenses.map(e => ({
        ...e,
        finalAmount: getCalculatedAmount(e),
        finalVat: getExpenseVat(e)
    }));

    const totalExpenses = allExpensesWithCalc.reduce((sum, e) => sum + e.finalAmount, 0);
    const totalExpensesVat = allExpensesWithCalc.reduce((sum, e) => sum + e.finalVat, 0);
    const netProfit = monthlyRevenue - totalExpenses;

    // --- Tax Logic (Replicated for 'True Net') ---
    const incomeVat = monthlyRevenue * 0.10;
    const vatDiff = incomeVat - totalExpensesVat;
    const payableVat = vatDiff > 0 ? vatDiff : 0;

    // Calculate Income Tax
    let incomeTax = 0;
    // Explicit check to satisfy TS
    const companyType = company?.type;

    if (companyType === 'limited') {
        incomeTax = monthlyRevenue * 0.25;
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
    const trueNetCash = netProfit - incomeTax - payableVat;


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
                        <input
                            type="number"
                            value={daysWorkedInMonth}
                            onChange={(e) => setDaysWorked(parseInt(e.target.value) || 0)}
                            className="bg-transparent text-lg font-bold text-white w-12 focus:outline-none border-b border-zinc-700 focus:border-indigo-500 transition-colors"
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
                            <div key={group.id} className={`bg-zinc-900/40 border ${group.borderColor} rounded-xl overflow-hidden`}>
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
                                            -{groupTotal.toFixed(2)} ₺
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
                                                    {(expense.autoType === 'percentage' || expense.autoType === 'courier') ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-zinc-300">{expense.name}</span>

                                                            {editingId === expense.id && editField === 'autoValue' ? (
                                                                <input
                                                                    autoFocus
                                                                    type="number"
                                                                    step="0.1" // Micro-step
                                                                    className="w-16 bg-zinc-800 border border-indigo-500 rounded px-1 text-center font-bold text-white text-xs"
                                                                    value={tempValue}
                                                                    onChange={e => setTempValue(e.target.value)}
                                                                    onBlur={() => saveEdit(expense)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-500/20"
                                                                    onClick={() => startEditing(expense, 'autoValue')}
                                                                >
                                                                    %{expense.autoValue}
                                                                </span>
                                                            )}

                                                            {/* Courier Cost */}
                                                            {expense.autoType === 'courier' && (
                                                                <>
                                                                    <span className="text-zinc-600 text-xs">x</span>
                                                                    {editingId === expense.id && editField === 'amount' ? (
                                                                        <input
                                                                            autoFocus
                                                                            type="number"
                                                                            className="w-16 bg-zinc-800 border border-indigo-500 rounded px-1 text-right font-mono text-xs"
                                                                            value={tempValue}
                                                                            onChange={e => setTempValue(e.target.value)}
                                                                            onBlur={() => saveEdit(expense)}
                                                                            onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                                        />
                                                                    ) : (
                                                                        <span
                                                                            className="text-xs text-zinc-500 cursor-pointer hover:text-white border-b border-dashed border-zinc-700 hover:border-zinc-500"
                                                                            onClick={() => startEditing(expense, 'amount')}
                                                                        >
                                                                            {expense.amount} ₺/pkt
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Standard Name
                                                        editingId === expense.id && editField === 'name' ? (
                                                            <input
                                                                autoFocus
                                                                className="bg-zinc-800 text-white px-2 py-0.5 rounded border border-indigo-500 outline-none w-full"
                                                                value={tempValue}
                                                                onChange={e => setTempValue(e.target.value)}
                                                                onBlur={() => saveEdit(expense)}
                                                                onKeyDown={e => e.key === 'Enter' && saveEdit(expense)}
                                                            />
                                                        ) : (
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
                                                        )
                                                    )}
                                                </div>

                                                {/* Amount Column - Navigable */}
                                                <div className="flex items-center gap-4">
                                                    {editingId === expense.id && editField === 'amount' && !expense.isAutomated && expense.autoType !== 'courier' ? (
                                                        <div className="relative">
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                className="w-24 bg-zinc-800 text-white text-right px-2 py-0.5 rounded border border-indigo-500 outline-none font-mono text-sm"
                                                                value={tempValue}
                                                                onChange={e => setTempValue(e.target.value)}
                                                                onBlur={() => saveEdit(expense)}
                                                                onKeyDown={(e) => handleKeyDown(e, expense, currentIndex)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span
                                                            data-amount-index={currentIndex}
                                                            className={`font-mono text-sm w-24 text-right ${!expense.isAutomated ? 'text-zinc-300 cursor-pointer hover:text-white border-b border-transparent hover:border-zinc-500' : 'text-zinc-500'}`}
                                                            onClick={() => !expense.isAutomated && startEditing(expense, 'amount')}
                                                        >
                                                            -{expense.finalAmount.toFixed(2)} ₺
                                                        </span>
                                                    )}

                                                    {/* Delete */}
                                                    <div className="w-6 flex justify-end">
                                                        {!expense.isAutomated && (
                                                            <button
                                                                onClick={() => removeExpense(expense.id)}
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
                                            />
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-24 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-white text-right font-mono focus:border-indigo-500 outline-none"
                                                value={newAmount}
                                                onChange={e => setNewAmount(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAdd(group.id)}
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

                    {/* Tax Module (Moved Up) */}
                    <TaxSummary
                        profit={netProfit}
                        revenue={monthlyRevenue}
                        expensesVat={totalExpensesVat}
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
                                <span className="text-green-400 font-bold font-mono text-2xl">{monthlyRevenue.toFixed(2)} ₺</span>
                            </div>

                            <div className="space-y-1 text-sm border-t border-zinc-800/50 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Net Kâr (Vergi Öncesi)</span>
                                    <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                                        {netProfit.toFixed(2)} ₺
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-600">Ödenecek Vergi (Tahmini)</span>
                                    <span className="text-red-400/70 font-mono">-{incomeTax.toFixed(2)} ₺</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-600">Ödenecek KDV (Tahmini)</span>
                                    <span className="text-red-400/70 font-mono">-{payableVat.toFixed(2)} ₺</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-zinc-700/50">
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-sm font-bold text-zinc-400">Vergi Sonrası Net Kâr</span>
                                    <div className={`text-3xl font-bold font-mono ${trueNetCash >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>
                                        {trueNetCash.toFixed(2)} ₺
                                    </div>
                                    <span className="text-[10px] text-zinc-500">Vergiler ve KDV ödendikten sonra kalan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
