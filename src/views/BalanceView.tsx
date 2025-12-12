import { Trash2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Expense } from '../types';

export function BalanceView() {
    const {
        recipes,
        salesTargets,
        expenses,
        addExpense,
        removeExpense,
        daysWorkedInMonth,
        setDaysWorked,
        packagingCosts
    } = useStore();

    // 1. Calculate Daily Totals from Sales Targets
    const totalDailyRevenue = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        return sum + (recipe ? recipe.calculatedPrice * target.dailyTarget : 0);
    }, 0);

    const totalDailyItems = salesTargets.reduce((sum, target) => sum + target.dailyTarget, 0);

    const totalDailyIngredientsCost = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        return sum + (recipe ? recipe.totalCost * target.dailyTarget : 0);
    }, 0);

    const packagingCostPerOrder = packagingCosts.reduce((sum, item) => sum + item.amount, 0);
    const totalDailyPackagingCost = totalDailyItems * packagingCostPerOrder;

    const totalDailyVariableCost = totalDailyIngredientsCost + totalDailyPackagingCost;

    // 2. Monthly Projections
    const monthlyRevenue = totalDailyRevenue * daysWorkedInMonth;
    const monthlyVariableCost = totalDailyVariableCost * daysWorkedInMonth;

    // 3. Fixed Expenses (Rent, Personnel, etc.)
    // Filter out 'variable' expenses if any were added by mistake, or just use all in 'expenses' as fixed for now
    // My previous assumption was 'expenses' array is for fixed expenses. 
    // And 'packagingCosts' is for variable packaging.
    const fixedExpenses = expenses;
    const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Final Balance
    const totalMonthlyExpenses = monthlyVariableCost + totalFixedExpenses;
    const netProfit = monthlyRevenue - totalMonthlyExpenses;
    const profitMargin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;

    const handleAddExpense = () => {
        const name = prompt('Gider Adı (Örn: Kira, Elektrik, Personel):');
        if (!name) return;
        const amountStr = prompt('Aylık Tutar (₺):');
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return;

        const newExpense: Expense = {
            id: crypto.randomUUID(),
            name,
            amount,
            category: 'fixed'
        };
        addExpense(newExpense);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Settings */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Aylık Bilanço</h2>
                    <p className="text-zinc-400">Genel finansal durum ve kâr/zarar analizi.</p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Aylık Çalışma Günü</div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={daysWorkedInMonth}
                                onChange={(e) => setDaysWorked(parseInt(e.target.value) || 0)}
                                className="bg-transparent text-xl font-bold text-white w-16 focus:outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                            />
                            <span className="text-zinc-500 text-sm">gün</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Expenses Management */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Fixed Expenses List */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="p-6 flex justify-between items-center border-b border-zinc-800">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Wallet size={20} className="text-red-400" />
                                Sabit Giderler (Aylık)
                            </h3>
                            <button
                                onClick={handleAddExpense}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors px-3 py-1.5 rounded text-zinc-300 font-medium"
                            >
                                + Gider Ekle
                            </button>
                        </div>

                        {fixedExpenses.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                Henüz sabit gider eklenmedi (Kira, faturalar vb.).
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {fixedExpenses.map((expense) => (
                                    <div key={expense.id} className="p-4 flex justify-between items-center group hover:bg-zinc-800/30 transition-colors">
                                        <div className="font-medium text-zinc-200">{expense.name}</div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono text-white">{expense.amount.toFixed(2)} ₺</div>
                                            <button
                                                onClick={() => removeExpense(expense.id)}
                                                className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex justify-between items-center">
                            <span className="text-zinc-400 font-medium">Toplam Sabit Gider</span>
                            <span className="text-red-400 font-bold font-mono text-lg">-{totalFixedExpenses.toFixed(2)} ₺</span>
                        </div>
                    </div>

                    {/* Cost Breakdown Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                            <div className="text-zinc-500 text-sm mb-1">Aylık Hamm madde Maliyeti</div>
                            <div className="text-orange-300 font-mono text-lg">
                                -{(totalDailyIngredientsCost * daysWorkedInMonth).toFixed(2)} ₺
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">Günlük {(totalDailyIngredientsCost).toFixed(2)} ₺ × {daysWorkedInMonth} gün</div>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                            <div className="text-zinc-500 text-sm mb-1">Aylık Ambalaj Maliyeti</div>
                            <div className="text-orange-300 font-mono text-lg">
                                -{(totalDailyPackagingCost * daysWorkedInMonth).toFixed(2)} ₺
                            </div>
                            <div className="text-xs text-zinc-600 mt-1">Günlük {(totalDailyPackagingCost).toFixed(2)} ₺ × {daysWorkedInMonth} gün</div>
                        </div>
                    </div>
                </div>

                {/* Right: Balance Summary Card */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 shadow-2xl sticky top-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="text-green-500" />
                            Finansal Özet
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-zinc-400">Tahmini Aylık Ciro</span>
                                <span className="text-green-400 font-bold font-mono text-xl">{monthlyRevenue.toFixed(2)} ₺</span>
                            </div>

                            <div className="w-full h-px bg-zinc-800 my-2"></div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Değişken Giderler (Malzeme)</span>
                                    <span className="text-red-300 font-mono">-{monthlyVariableCost.toFixed(2)} ₺</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Sabit Giderler</span>
                                    <span className="text-red-300 font-mono">-{totalFixedExpenses.toFixed(2)} ₺</span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-zinc-800 my-2"></div>

                            <div className="flex justify-between items-center text-sm text-zinc-400 mb-1">
                                <span>Toplam Gider</span>
                                <span className="text-red-400 font-mono">-{totalMonthlyExpenses.toFixed(2)} ₺</span>
                            </div>

                            <div className="pt-4 mt-4 border-t border-zinc-700/50">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-white">Net Kâr</span>
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold font-mono ${netProfit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                                            {netProfit.toFixed(2)} ₺
                                        </div>
                                        <div className={`text-sm mt-1 font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            %{profitMargin.toFixed(1)} Kâr Marjı
                                        </div>
                                    </div>
                                </div>

                                {netProfit < 0 && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-200 text-sm">
                                        <TrendingDown size={18} />
                                        <span>Hey, dikkat et! Şu an zarardasın. Giderlerini gözden geçir veya satış hedeflerini arttır.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
