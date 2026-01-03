import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CustomSelect } from '../components/CustomSelect';
import { NumberInput } from '../components/NumberInput';
import type { MarketPriceEntry, Recipe } from '../types';

export function MarketAnalysisView() {
    const { recipes, marketPrices, addMarketPrice, updateMarketPrice, deleteMarketPrice } = useStore();

    // Analysis mode toggle
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Get unique competitor names from existing entries for autocomplete
    const existingCompetitors = useMemo(() => {
        const names = new Set(marketPrices.map(p => p.competitorName));
        return Array.from(names).filter(Boolean).sort();
    }, [marketPrices]);

    // Add a new row
    const handleAddRow = () => {
        const newEntry: MarketPriceEntry = {
            id: `mp_${Date.now()}`,
            competitorName: '',
            productName: '',
            price: 0,
            includesFries: false,
            includesDrink: false,
            includesSauce: false,
            includesOther: '',
            matchedRecipeId: undefined
        };
        addMarketPrice(newEntry);
    };

    // Update a field in an entry
    const handleUpdate = (id: string, field: keyof MarketPriceEntry, value: any) => {
        const entry = marketPrices.find(p => p.id === id);
        if (entry) {
            updateMarketPrice(id, { ...entry, [field]: value });
        }
    };

    // Analysis data computation
    const analysisData = useMemo(() => {
        // Get matched recipes with their market prices
        const matchedRecipeIds = new Set(marketPrices.filter(p => p.matchedRecipeId).map(p => p.matchedRecipeId));

        return Array.from(matchedRecipeIds).map(recipeId => {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return null;

            const competitorPrices = marketPrices.filter(p => p.matchedRecipeId === recipeId);
            const pricesByCompetitor: Record<string, { price: number; entry: MarketPriceEntry }> = {};

            competitorPrices.forEach(p => {
                pricesByCompetitor[p.competitorName] = { price: p.price, entry: p };
            });

            const prices = competitorPrices.map(p => p.price).filter(p => p > 0);
            const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
            const diffPercent = recipe.calculatedPrice > 0 && avgPrice > 0
                ? ((avgPrice - recipe.calculatedPrice) / recipe.calculatedPrice) * 100
                : 0;

            return {
                recipe,
                pricesByCompetitor,
                avgPrice,
                diffPercent,
                ourPrice: recipe.calculatedPrice
            };
        }).filter(Boolean);
    }, [marketPrices, recipes]);

    // Get all unique competitors for analysis table columns
    const allCompetitors = useMemo(() => {
        return Array.from(new Set(marketPrices.map(p => p.competitorName).filter(Boolean))).sort();
    }, [marketPrices]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Pazar Analizi</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Rakip fiyatlarını karşılaştırın ve pozisyonunuzu analiz edin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95 ${showAnalysis
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                            }`}
                    >
                        <TrendingUp size={20} />
                        {showAnalysis ? 'Veri Girişi' : 'Analiz Et'}
                    </button>
                    {!showAnalysis && (
                        <button
                            onClick={handleAddRow}
                            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <Plus size={20} />
                            Yeni Satır
                        </button>
                    )}
                </div>
            </div>

            {/* Data Entry Table */}
            {!showAnalysis && (
                <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rakip</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ürün Adı</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-24">Fiyat</th>
                                    <th className="text-center px-2 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-12 cursor-help" title="Patates Kızartması Dahil mi?">🍟</th>
                                    <th className="text-center px-2 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-12 cursor-help" title="İçecek Dahil mi?">🥤</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Diğer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bizim Ürün</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {marketPrices.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-600">
                                            <div className="flex flex-col items-center gap-3">
                                                <TrendingUp className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                                                <p>Henüz veri eklenmedi. "Yeni Satır" butonuna tıklayın.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    marketPrices.map((entry) => (
                                        <TableRow
                                            key={entry.id}
                                            entry={entry}
                                            recipes={recipes}
                                            existingCompetitors={existingCompetitors}
                                            onUpdate={handleUpdate}
                                            onDelete={deleteMarketPrice}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {showAnalysis && (
                <div className="space-y-6">
                    {analysisData.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
                            <TrendingUp className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Analiz Verisi Yok</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Veri girişi ekranında rakip ürünlerini "Bizim Ürün" sütunuyla eşleştirin.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp size={18} className="text-emerald-500" />
                                    Karşılaştırma Tablosu
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bizim Ürün</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bizim Fiyat</th>
                                            {allCompetitors.map(comp => (
                                                <th key={comp} className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{comp}</th>
                                            ))}
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ortalama</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Fark</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {analysisData.map((data: any) => (
                                            <tr key={data.recipe.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{data.recipe.name}</td>
                                                <td className="px-4 py-3 text-right text-zinc-900 dark:text-white font-mono">{data.ourPrice.toFixed(0)}₺</td>
                                                {allCompetitors.map(comp => {
                                                    const compData = data.pricesByCompetitor[comp];
                                                    if (!compData) {
                                                        return <td key={comp} className="px-4 py-3 text-right text-zinc-400 dark:text-zinc-600">-</td>;
                                                    }
                                                    const { price, entry } = compData;
                                                    const icons = [
                                                        entry.includesFries && '🍟',
                                                        entry.includesDrink && '🥤'
                                                    ].filter(Boolean).join('');
                                                    return (
                                                        <td key={comp} className="px-4 py-3 text-right font-mono text-zinc-900 dark:text-white">
                                                            {price.toFixed(0)}₺ <span className="text-xs">{icons}</span>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-right font-mono text-zinc-900 dark:text-white">{data.avgPrice.toFixed(0)}₺</td>
                                                <td className={`px-4 py-3 text-right font-bold ${data.diffPercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : data.diffPercent < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'
                                                    }`}>
                                                    {data.diffPercent > 0 ? '🟢' : data.diffPercent < 0 ? '🔴' : '⚪'} {data.diffPercent > 0 ? '+' : ''}{data.diffPercent.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                                🟢 Biz ucuzuz • 🔴 Biz pahalıyız • Emojiler dahil olan ekleri gösterir (🍟 Patates, 🥤 İçecek)
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Separate component for table row to handle inline editing
function TableRow({
    entry,
    recipes,
    existingCompetitors,
    onUpdate,
    onDelete
}: {
    entry: MarketPriceEntry;
    recipes: Recipe[];
    existingCompetitors: string[];
    onUpdate: (id: string, field: keyof MarketPriceEntry, value: any) => void;
    onDelete: (id: string) => void;
}) {
    const [showCompetitorDropdown, setShowCompetitorDropdown] = useState(false);
    const [competitorFilter, setCompetitorFilter] = useState(entry.competitorName);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Show all competitors if filter is empty, otherwise filter by input
    const filteredCompetitors = competitorFilter.trim() === ''
        ? existingCompetitors
        : existingCompetitors.filter(c =>
            c.toLowerCase().includes(competitorFilter.toLowerCase())
        );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowCompetitorDropdown(false);
            }
        };

        if (showCompetitorDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCompetitorDropdown]);

    const handleFocus = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
        setShowCompetitorDropdown(true);
    };

    return (
        <tr className="transition-colors">
            {/* Competitor Name with Autocomplete */}
            <td className="px-4 py-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={competitorFilter}
                    onChange={(e) => {
                        setCompetitorFilter(e.target.value);
                        onUpdate(entry.id, 'competitorName', e.target.value);
                    }}
                    onFocus={handleFocus}
                    placeholder="Rakip adı..."
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-zinc-900 dark:text-white placeholder-zinc-400"
                />
                {showCompetitorDropdown && filteredCompetitors.length > 0 && createPortal(
                    <div
                        ref={dropdownRef}
                        className="fixed z-[9999] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-40 overflow-y-auto"
                        style={{
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                            minWidth: 200
                        }}
                    >
                        {filteredCompetitors.map(comp => (
                            <button
                                key={comp}
                                className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm text-zinc-900 dark:text-white"
                                onMouseDown={() => {
                                    setCompetitorFilter(comp);
                                    onUpdate(entry.id, 'competitorName', comp);
                                    setShowCompetitorDropdown(false);
                                }}
                            >
                                {comp}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
            </td>

            {/* Product Name */}
            <td className="px-4 py-2">
                <input
                    type="text"
                    value={entry.productName}
                    onChange={(e) => onUpdate(entry.id, 'productName', e.target.value)}
                    placeholder="Ürün adı..."
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-zinc-900 dark:text-white placeholder-zinc-400"
                />
            </td>

            {/* Price */}
            <td className="px-4 py-2">
                <NumberInput
                    value={entry.price}
                    onChange={(val) => onUpdate(entry.id, 'price', val)}
                    min={0}
                    placeholder="0"
                    description="₺"
                />
            </td>

            {/* Checkbox: Fries */}
            <td className="px-2 py-2 text-center" title="Patates Kızartması Dahil mi?">
                <input
                    type="checkbox"
                    checked={entry.includesFries}
                    onChange={(e) => onUpdate(entry.id, 'includesFries', e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Patates Kızartması Dahil mi?"
                />
            </td>

            {/* Checkbox: Drink */}
            <td className="px-2 py-2 text-center" title="İçecek Dahil mi?">
                <input
                    type="checkbox"
                    checked={entry.includesDrink}
                    onChange={(e) => onUpdate(entry.id, 'includesDrink', e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="İçecek Dahil mi?"
                />
            </td>

            {/* Other Inclusions */}
            <td className="px-4 py-2">
                <input
                    type="text"
                    value={entry.includesOther || ''}
                    onChange={(e) => onUpdate(entry.id, 'includesOther', e.target.value)}
                    placeholder="Diğer..."
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm"
                />
            </td>

            {/* Recipe Match Dropdown */}
            <td className="px-4 py-2">
                <CustomSelect
                    value={entry.matchedRecipeId || ''}
                    onChange={(value) => onUpdate(entry.id, 'matchedRecipeId', value || undefined)}
                    options={[
                        { label: 'Seçiniz...', value: '' },
                        ...recipes.map(recipe => ({ label: recipe.name, value: recipe.id }))
                    ]}
                    placeholder="Seçiniz..."
                    searchable={true}
                />
            </td>

            {/* Delete Button */}
            <td className="px-2 py-2">
                <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                    <Trash2 size={16} />
                </button>
            </td>
        </tr>
    );
}
