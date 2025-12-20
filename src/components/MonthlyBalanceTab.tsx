import { TrendingUp } from 'lucide-react';
import type { MonthlyMonthData } from '../types';
import { useMonthlyAggregation } from '../hooks/useMonthlyAggregation';
import { TaxSummary } from './TaxSummary';

// Basic formatter
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

interface MonthlyBalanceTabProps {
    data: MonthlyMonthData;
}

export function MonthlyBalanceTab({ data }: MonthlyBalanceTabProps) {

    // --- AGGREGATION LOGIC ---
    const { aggregatedData, netProfit, netProfitAfterTax, totalTaxPayable } = useMonthlyAggregation(data);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* LEFT: Expenses (8 Cols) */}
            <div className="xl:col-span-8 space-y-6">
                {aggregatedData.groups.map((group) => {
                    const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
                    const groupRevenueShare = aggregatedData.totalRevenue > 0 ? (groupTotal / aggregatedData.totalRevenue) * 100 : 0;

                    return (
                        <div key={group.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden`}>
                            {/* Group Header */}
                            <div className={`px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900`}>
                                <h3 className={`font-bold text-zinc-700 dark:text-zinc-200 text-sm flex items-center gap-2`}>
                                    <group.icon size={18} className={group.color} />
                                    {group.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                                        %{groupRevenueShare.toFixed(1)} Ciro
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400 text-sm font-bold">
                                        -{formatCurrency(groupTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-2">
                                {group.items.map((item, idx) => {
                                    const itemShare = aggregatedData.totalRevenue > 0 ? (item.amount / aggregatedData.totalRevenue) * 100 : 0;
                                    const isEmpty = item.amount === 0;

                                    return (
                                        <div key={idx} className={`flex items-center justify-between text-sm py-2 px-3 border-b last:border-0 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isEmpty ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.name}</span>
                                                {item.isAuto && (
                                                    <span className="text-[10px] text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                                        OTOMATİK
                                                    </span>
                                                )}
                                                {item.note && (
                                                    <span className="text-[10px] text-zinc-400">
                                                        ({item.note})
                                                    </span>
                                                )}
                                                {!isEmpty && (
                                                    <span className="text-zinc-400 text-xs ml-2">
                                                        (%{itemShare.toFixed(1)})
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`font-mono font-medium ${isEmpty ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                {isEmpty ? '-' : `-${formatCurrency(item.amount)}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* RIGHT: Financial Summary (4 Cols) */}
            <div className="xl:col-span-4 space-y-6">

                {/* Tax Summary Module */}
                <TaxSummary
                    profit={netProfit}
                    revenue={aggregatedData.totalRevenue}
                    expensesVat={aggregatedData.totalDeductibleVat}
                    stopaj={aggregatedData.totalStopajTax}
                />

                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                        <TrendingUp className="text-green-500" />
                        Finansal Özet ({data.monthStr})
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-baseline pb-2">
                            <span className="text-zinc-400">Tahmini Aylık Ciro</span>
                            <span className="text-green-400 font-bold font-mono text-2xl">{formatCurrency(aggregatedData.totalRevenue)}</span>
                        </div>

                        {/* Expense Breakdown */}
                        <div className="space-y-1 py-3 border-t border-zinc-800/50">
                            {aggregatedData.groups.map(group => {
                                const groupTotal = group.items.reduce((sum, item) => sum + item.amount, 0);
                                const percentage = aggregatedData.totalRevenue > 0 ? (groupTotal / aggregatedData.totalRevenue) * 100 : 0;

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

                        <div className="pt-4 mt-2 border-t border-zinc-800">
                            {/* Net Profit Pre-Tax */}
                            <div className="flex justify-between mb-2">
                                <span className="text-zinc-500">Net Kâr (Vergi Öncesi)</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${netProfit >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        %{aggregatedData.totalRevenue > 0 ? ((netProfit / aggregatedData.totalRevenue) * 100).toFixed(1) : '0.0'}
                                    </span>
                                    <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-white' : 'text-red-500'}`}>
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>

                            {/* Taxes */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-red-400 font-bold border-t border-zinc-800/50 pt-1 mt-1">
                                    <span>Ödenecek Toplam Vergi</span>
                                    <span className="font-mono">-{formatCurrency(totalTaxPayable)}</span>
                                </div>
                            </div>

                            {/* Net Profit After Tax */}
                            <div className="mt-6 flex flex-col items-end">
                                <span className="text-sm font-bold text-zinc-400">Vergi Sonrası Net Kâr</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${netProfitAfterTax >= 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
                                        %{aggregatedData.totalRevenue > 0 ? ((netProfitAfterTax / aggregatedData.totalRevenue) * 100).toFixed(1) : '0.0'}
                                    </span>
                                    <div className={`text-3xl font-bold font-mono ${netProfitAfterTax >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>
                                        {formatCurrency(netProfitAfterTax)}
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-500">Vergiler ve KDV ödendikten sonra kalan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
