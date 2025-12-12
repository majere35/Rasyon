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
            </div >

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Target List */}
        <div className="lg:col-span-2 space-y-4">
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
