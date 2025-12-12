import { Plus, Trash2, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SalesTarget } from '../types';

export function TargetsView() {
    const { recipes, salesTargets, addSalesTarget, updateSalesTarget, removeSalesTarget, packagingCosts, addPackagingCost, removePackagingCost } = useStore();

    // Calculate Totals
    const totalDailyItems = salesTargets.reduce((sum, target) => sum + target.dailyTarget, 0);

    const totalDailyRevenue = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        return sum + (recipe ? recipe.calculatedPrice * target.dailyTarget : 0);
    }, 0);

    const totalDailyCost = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        return sum + (recipe ? recipe.totalCost * target.dailyTarget : 0);
    }, 0);

    // Packaging Cost Per Order (sum of unit costs of all packaging items)
    const packagingCostPerOrder = (packagingCosts || []).reduce((sum, item) => sum + item.amount, 0);
    const totalDailyPackagingCost = totalDailyItems * packagingCostPerOrder;

    const totalDailyProfit = totalDailyRevenue - totalDailyCost - totalDailyPackagingCost;
    const avgRevenuePerItem = totalDailyItems > 0 ? totalDailyRevenue / totalDailyItems : 0;
    const avgCostPercentage = totalDailyRevenue > 0 ? ((totalDailyCost + totalDailyPackagingCost) / totalDailyRevenue) * 100 : 0;

    const handleAddTarget = () => {
        if (recipes.length === 0) return alert('Önce reçete eklemelisiniz!');
        const newTarget: SalesTarget = {
            id: crypto.randomUUID(),
            recipeId: recipes[0].id,
            dailyTarget: 10
        };
        addSalesTarget(newTarget);
    };

    const handleAddPackaging = () => {
        const name = prompt('Ambalaj Malzemesi Adı (Örn: Peçete):');
        if (!name) return;
        const amountStr = prompt('Birim Başı Maliyet (₺):');
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return;

        addPackagingCost({
            id: crypto.randomUUID(),
            name,
            amount,
            category: 'variable'
        });
    };

    return (
        <div className="space-y-8">
            {/* Introduction */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Satış Hedefleri</h2>
                    <p className="text-zinc-400">Ürün bazlı satış hedeflerinizi belirleyin ve kârlılık analizi yapın.</p>
                </div>
                <button
                    onClick={handleAddTarget}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={18} /> Hedef Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Target List & Packaging */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Sales Targets Table */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/80 text-zinc-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Ürün</th>
                                    <th className="px-6 py-4 w-32">Maliyet</th>
                                    <th className="px-6 py-4 w-32">Satış Fiyatı</th>
                                    <th className="px-6 py-4 w-32">Günlük Adet</th>
                                    <th className="px-6 py-4 w-32 text-right">Ciro</th>
                                    <th className="px-6 py-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {salesTargets.map((target) => {
                                    const recipe = recipes.find(r => r.id === target.recipeId);
                                    if (!recipe) return null;
                                    return (
                                        <tr key={target.id} className="group hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <select
                                                    value={target.recipeId}
                                                    onChange={(e) => updateSalesTarget(target.id, { ...target, recipeId: e.target.value })}
                                                    className="bg-transparent text-white font-medium focus:outline-none w-full cursor-pointer hover:text-indigo-400"
                                                >
                                                    {recipes.map(r => (
                                                        <option key={r.id} value={r.id} className="bg-zinc-800">{r.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 font-mono">
                                                {recipe.totalCost.toFixed(2)} ₺
                                            </td>
                                            <td className="px-6 py-4 text-zinc-200 font-mono">
                                                {recipe.calculatedPrice.toFixed(2)} ₺
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={target.dailyTarget}
                                                    onChange={(e) => updateSalesTarget(target.id, { ...target, dailyTarget: parseInt(e.target.value) || 0 })}
                                                    className="w-20 bg-zinc-800 rounded px-2 py-1 text-center font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-green-400 font-medium">
                                                {(recipe.calculatedPrice * target.dailyTarget).toFixed(2)} ₺
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => removeSalesTarget(target.id)}
                                                    className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {salesTargets.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                            Henüz satış hedefi eklenmedi.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Packaging Costs Section */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Package size={20} className="text-orange-400" />
                                Ambalaj Maliyetleri (Birim Başı)
                            </h3>
                            <button
                                onClick={handleAddPackaging}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors px-3 py-1.5 rounded text-zinc-300 font-medium"
                            >
                                + Ekle
                            </button>
                        </div>

                        {packagingCosts.length === 0 ? (
                            <p className="text-sm text-zinc-500 py-2">Henüz ambalaj maliyeti eklenmedi. (Örn: Peçete, Poşet, Paket Lastiği)</p>
                        ) : (
                            <div className="space-y-2">
                                {packagingCosts.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800/50 p-3 rounded-lg group">
                                        <div>
                                            <div className="text-zinc-200 font-medium">{item.name}</div>
                                            <div className="text-xs text-zinc-500">Birim maliyet</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono text-orange-400">-{item.amount.toFixed(2)} ₺</div>
                                            <button
                                                onClick={() => removePackagingCost(item.id)}
                                                className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 mt-2">
                                    <span className="text-sm text-zinc-400">Toplam Ambalaj (Birim Başı)</span>
                                    <span className="font-mono text-orange-400 font-bold">-{packagingCostPerOrder.toFixed(2)} ₺</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Summary Card */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm sticky top-6">
                        <h3 className="text-lg font-bold text-white mb-6">Tahmini Günlük Özet</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Toplam Satış Adedi</span>
                                <span className="text-white font-bold">{totalDailyItems}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Ort. Ürün Geliri</span>
                                <span className="text-white font-mono">{avgRevenuePerItem.toFixed(2)} ₺</span>
                            </div>
                            <div className="w-full h-px bg-white/10 my-2"></div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Toplam Ciro</span>
                                <span className="text-green-400 font-bold font-mono text-lg">{totalDailyRevenue.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Ürün Maliyeti</span>
                                <span className="text-red-400 font-mono">-{totalDailyCost.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Ambalaj Maliyeti</span>
                                <span className="text-orange-400 font-mono">-{totalDailyPackagingCost.toFixed(2)} ₺</span>
                            </div>
                            <div className="w-full h-px bg-white/10 my-2"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-zinc-200 font-bold">Net Kâr</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white font-mono">{totalDailyProfit.toFixed(2)} ₺</div>
                                    <div className="text-xs text-indigo-300 mt-1">Maliyet: %{avgCostPercentage.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
