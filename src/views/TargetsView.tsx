import { useState, useRef } from 'react';
import { Plus, Trash2, Package, Save, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CustomSelect } from '../components/CustomSelect';
import { NumberInput } from '../components/NumberInput';
import { formatCurrency } from '../lib/utils';
import type { SalesTarget, Expense } from '../types';

export function TargetsView() {
    const { recipes, salesTargets, addSalesTarget, updateSalesTarget, removeSalesTarget, packagingCosts, addPackagingCost, removePackagingCost, updatePackagingCost, updateRecipe } = useStore();

    // Inline input states for Packaging
    const [newPkgName, setNewPkgName] = useState('');
    const [newPkgAmount, setNewPkgAmount] = useState('');

    // Inline editing states for Packaging
    const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
    const [editPkgName, setEditPkgName] = useState('');
    const [editPkgAmount, setEditPkgAmount] = useState('');

    // Calculate Totals
    const totalDailyItems = salesTargets.reduce((sum, target) => sum + (target.dailyTarget || 0) + (target.packageDailyTarget || 0), 0);

    const totalDailyRevenue = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        if (!recipe) return sum;

        const restQty = target.dailyTarget || 0;
        const pkgQty = target.packageDailyTarget || 0;

        const restRevenue = recipe.calculatedPrice * restQty;
        const pkgRevenue = recipe.calculatedPrice * pkgQty;

        return sum + restRevenue + pkgRevenue;
    }, 0);

    const totalDailyCost = salesTargets.reduce((sum, target) => {
        const recipe = recipes.find(r => r.id === target.recipeId);
        if (!recipe) return sum;

        const restQty = target.dailyTarget || 0;
        const pkgQty = target.packageDailyTarget || 0;

        const restCost = recipe.totalCost * restQty;
        const pkgCost = recipe.totalCost * pkgQty;

        return sum + restCost + pkgCost;
    }, 0);

    // Packaging Cost Per Order (sum of unit costs of all packaging items)
    const packagingCostPerOrder = (packagingCosts || []).reduce((sum, item) => sum + item.amount, 0);

    // UPDATED CHECK: Only apply packaging cost to PACKAGE QUANTITY (packageDailyTarget)
    const totalDailyPackagingCost = salesTargets.reduce((sum, target) => {
        return sum + ((target.packageDailyTarget || 0) * packagingCostPerOrder);
    }, 0);

    const totalDailyProfit = totalDailyRevenue - totalDailyCost - totalDailyPackagingCost;
    const avgRevenuePerItem = totalDailyItems > 0 ? totalDailyRevenue / totalDailyItems : 0;
    const avgCostPercentage = totalDailyRevenue > 0 ? ((totalDailyCost + totalDailyPackagingCost) / totalDailyRevenue) * 100 : 0;

    const handleAddTarget = () => {
        if (recipes.length === 0) return alert('Önce reçete eklemelisiniz!');
        const newTarget: SalesTarget = {
            id: crypto.randomUUID(),
            recipeId: recipes[0].id,
            dailyTarget: 1, // Default Restaurant Qty
            packageDailyTarget: 0 // Default Package Qty
        };
        addSalesTarget(newTarget);
    };

    // Focus management
    const nameRef = useRef<HTMLInputElement>(null);

    const handleAddPackaging = () => {
        if (!newPkgName || !newPkgAmount) return;
        const amount = parseFloat(newPkgAmount);
        if (isNaN(amount)) return;

        addPackagingCost({
            id: crypto.randomUUID(),
            name: newPkgName,
            amount,
            category: 'variable'
        });
        setNewPkgName('');
        setNewPkgAmount('');

        // Refocus on name input
        setTimeout(() => nameRef.current?.focus(), 0);
    };

    const startEditingPkg = (pkg: Expense) => {
        setEditingPkgId(pkg.id);
        setEditPkgName(pkg.name);
        setEditPkgAmount(pkg.amount.toString());
    };

    const saveEditingPkg = () => {
        if (editingPkgId && updatePackagingCost) {
            const amount = parseFloat(editPkgAmount);
            if (isNaN(amount)) return;

            updatePackagingCost(editingPkgId, {
                id: editingPkgId,
                name: editPkgName,
                amount,
                category: 'variable'
            });
        }
        setEditingPkgId(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Satış Hedefleri</h2>
                    <p className="text-zinc-400">Ürün bazlı satış hedeflerinizi belirleyin ve kârlılık analizi yapın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Target List & Packaging */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Sales Targets Table */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                        {/* Header with Add Button at top right of table area as requested */}
                        <div className="flex justify-between items-center px-6 py-3 bg-zinc-900/80 border-b border-zinc-800">
                            <h3 className="font-bold text-zinc-300">Hedef Tablosu</h3>
                            <button
                                onClick={handleAddTarget}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition-colors"
                            >
                                <Plus size={16} /> Hedef Ekle
                            </button>
                        </div>

                        <table className="w-full text-left text-sm table-fixed">
                            <thead className="bg-zinc-900/50 text-zinc-400 font-medium border-b border-zinc-800">
                                <tr>
                                    {/* Optimization: Fixed widths using precise percentages to sum to ~100% */}
                                    <th className="px-4 py-2 w-[25%]">Ürün Adı</th>
                                    <th className="px-1 py-2 text-right whitespace-nowrap text-xs w-[10%]">Brm. Mal.</th>
                                    <th className="px-1 py-2 text-center whitespace-nowrap text-xs w-[10%]">Rest. Adet</th>
                                    <th className="px-1 py-2 text-center whitespace-nowrap text-xs w-[10%]">Pkt. Adet</th>
                                    <th className="px-1 py-2 text-right whitespace-nowrap text-xs w-[12%]">Topl. Mal.</th>
                                    <th className="px-1 py-2 text-right whitespace-nowrap text-xs w-[12%]">Brm. Fiyat</th>
                                    <th className="px-1 py-2 text-right whitespace-nowrap text-xs w-[12%]">Ciro</th>
                                    <th className="px-1 py-2 text-right whitespace-nowrap text-xs w-[5%]">Mal. %</th>
                                    <th className="px-1 py-2 w-[4%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {salesTargets.map((target) => {
                                    const recipe = recipes.find(r => r.id === target.recipeId);
                                    if (!recipe) return null;

                                    const restaurantQty = target.dailyTarget || 0;
                                    const packageQty = target.packageDailyTarget || 0;
                                    const totalQty = restaurantQty + packageQty;


                                    const totalCost = recipe.totalCost * totalQty;
                                    const totalRevenue = recipe.calculatedPrice * totalQty;

                                    // Cost % for this line (Ingredient cost only usually, or should we include pkg?)
                                    // Standard practice: Line item cost % usually just ingredients vs price. 
                                    const costPercent = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

                                    return (
                                        <tr key={target.id} className="group hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-1">
                                                <CustomSelect
                                                    value={target.recipeId}
                                                    onChange={(val) => updateSalesTarget(target.id, { ...target, recipeId: val })}
                                                    options={recipes.map(r => ({ label: r.name, value: r.id }))}
                                                    searchable={recipes.length > 5}
                                                />
                                            </td>
                                            {/* Order: Unit Cost -> Qty -> Total Cost -> Unit Price -> Total Revenue -> Cost % */}
                                            <td className="px-1 py-1 text-right text-zinc-400 font-mono text-xs">
                                                {formatCurrency(recipe.totalCost)}
                                            </td>
                                            <td className="px-1 py-1 text-center">
                                                <NumberInput
                                                    min={0}
                                                    value={target.dailyTarget} // Maps to Restaurant Quantity now
                                                    onChange={(val) => updateSalesTarget(target.id, { ...target, dailyTarget: val || 0 })}
                                                    className="w-full max-w-[80px] mx-auto"
                                                    placeholder="R"
                                                />
                                            </td>
                                            <td className="px-1 py-1 text-center">
                                                <NumberInput
                                                    min={0}
                                                    value={target.packageDailyTarget || 0}
                                                    onChange={(val) => updateSalesTarget(target.id, { ...target, packageDailyTarget: val || 0 })}
                                                    className="w-full max-w-[80px] mx-auto"
                                                    placeholder="P"
                                                />
                                            </td>
                                            <td className="px-1 py-1 text-right text-red-300 font-mono text-xs truncate">
                                                {formatCurrency(totalCost)}
                                            </td>
                                            <td className="px-1 py-1 text-right text-zinc-200 font-mono">
                                                <NumberInput
                                                    min={0}
                                                    step={0.01}
                                                    value={recipe.calculatedPrice}
                                                    onChange={(val) => {
                                                        const newPrice = val;
                                                        if (!isNaN(newPrice)) {
                                                            const newMultiplier = recipe.totalCost > 0 ? newPrice / recipe.totalCost : 0;
                                                            updateRecipe(recipe.id, {
                                                                ...recipe,
                                                                calculatedPrice: newPrice,
                                                                costMultiplier: newMultiplier
                                                            });
                                                        }
                                                    }}
                                                    className="w-full"
                                                />
                                            </td>
                                            <td className="px-1 py-1 text-right font-mono text-green-400 font-medium text-xs truncate">
                                                {formatCurrency(totalRevenue)}
                                            </td>
                                            <td className="px-1 py-1 text-right text-zinc-500 text-xs">
                                                %{costPercent.toFixed(0)}
                                            </td>
                                            <td className="px-1 py-1 text-center">
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
                                        <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                                            Henüz satış hedefi eklenmedi.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Packaging Costs Section (Inline Entry) */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Package size={20} className="text-orange-400" />
                                Ambalaj Maliyetleri (Birim Başı)
                            </h3>
                        </div>

                        <div className="space-y-1">
                            {/* Existing Items */}
                            {packagingCosts.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800/50 p-1 rounded-lg group">
                                    {editingPkgId === item.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editPkgName}
                                                onChange={(e) => setEditPkgName(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                className="flex-1 bg-zinc-800 text-white px-2 py-0.5 rounded border border-indigo-500/50 outline-none text-xs"
                                                onKeyDown={(e) => e.key === 'Enter' && saveEditingPkg()}
                                            />
                                            <input
                                                type="number"
                                                value={editPkgAmount}
                                                onChange={(e) => setEditPkgAmount(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                className="w-20 bg-zinc-800 text-white text-right px-2 py-0.5 rounded border border-indigo-500/50 outline-none font-mono text-xs"
                                                onKeyDown={(e) => e.key === 'Enter' && saveEditingPkg()}
                                            />
                                            <button
                                                onClick={saveEditingPkg}
                                                className="p-1 bg-green-900/50 text-green-400 hover:text-white rounded"
                                            >
                                                <Save size={14} />
                                            </button>
                                            <button
                                                onClick={() => setEditingPkgId(null)}
                                                className="p-1 text-zinc-500 hover:text-white rounded"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className="flex-1 flex items-center justify-between px-2 cursor-pointer hover:bg-zinc-800/50 rounded transition-colors"
                                                onClick={() => startEditingPkg(item)}
                                            >
                                                <span className="text-zinc-300 font-medium text-xs">{item.name}</span>
                                                <span className="font-mono text-orange-400 text-xs">-{formatCurrency(item.amount)}</span>
                                            </div>
                                            <button
                                                onClick={() => removePackagingCost(item.id)}
                                                className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-red-400 transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}

                            {/* Inline Add Row */}
                            <div className="flex items-center gap-2 bg-zinc-800/20 p-1 rounded-lg border border-zinc-800 border-dashed">
                                <input
                                    ref={nameRef}
                                    type="text"
                                    value={newPkgName}
                                    onChange={(e) => setNewPkgName(e.target.value)}
                                    placeholder="Yeni Malzeme (Örn: Paket)"
                                    onFocus={(e) => e.target.select()}
                                    className="flex-1 bg-transparent border-b border-zinc-700/50 focus:border-indigo-500 px-2 py-0.5 text-white placeholder-zinc-600 focus:outline-none transition-colors text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddPackaging()}
                                />
                                <div className="relative w-20">
                                    <input
                                        type="number"
                                        value={newPkgAmount}
                                        onChange={(e) => setNewPkgAmount(e.target.value)}
                                        placeholder="0.00"
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-transparent border-b border-zinc-700/50 focus:border-indigo-500 px-2 py-0.5 text-white placeholder-zinc-600 focus:outline-none transition-colors text-right text-xs font-mono"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddPackaging()}
                                    />
                                    <span className="absolute right-0 top-0.5 text-zinc-500 text-[10px] pointer-events-none">₺</span>
                                </div>
                                <button
                                    onClick={handleAddPackaging}
                                    disabled={!newPkgName || !newPkgAmount}
                                    className="p-1 bg-zinc-800 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-zinc-800 text-white rounded transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-zinc-800 mt-2">
                                <span className="text-sm text-zinc-400">Toplam Ambalaj (Birim Başı)</span>
                                <div className="text-right">
                                    <div className="font-mono text-orange-400 font-bold">-{formatCurrency(packagingCostPerOrder)}</div>
                                </div>
                            </div>
                        </div>
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
                                <span className="text-white font-mono">{formatCurrency(avgRevenuePerItem)}</span>
                            </div>
                            <div className="w-full h-px bg-white/10 my-2"></div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Toplam Ciro</span>
                                <span className="text-green-400 font-bold font-mono text-lg">{formatCurrency(totalDailyRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Ürün Maliyeti</span>
                                <span className="text-red-400 font-mono">-{formatCurrency(totalDailyCost)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Ambalaj Maliyeti</span>
                                <span className="text-orange-400 font-mono">-{formatCurrency(totalDailyPackagingCost)}</span>
                            </div>
                            <div className="w-full h-px bg-white/10 my-2"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-zinc-200 font-bold">Net Kâr</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white font-mono">{formatCurrency(totalDailyProfit)}</div>
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
