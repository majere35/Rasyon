import { Trash2, Edit2, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber, getNetPrice } from '../lib/utils';
import type { Recipe } from '../types';

interface RecipeCardProps {
    recipe: Recipe;
    onEdit: (recipe: Recipe) => void;
    onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
    const netPrice = getNetPrice(recipe.calculatedPrice);
    const profitMargin = netPrice > 0
        ? ((netPrice - recipe.totalCost) / netPrice * 100).toFixed(1)
        : 0;

    const handleDelete = () => {
        onDelete(recipe.id);
    };

    return (
        <div className="group relative bg-zinc-800/50 border border-zinc-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col">
            {/* Image Section */}
            <div className="aspect-square bg-zinc-900 relative overflow-hidden group">
                {recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-zinc-700 bg-zinc-800/50">
                        <span className="text-xs">Görsel Yok</span>
                    </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1 backdrop-blur-sm">
                    <button
                        onClick={() => onEdit(recipe)}
                        className="p-1.5 hover:bg-indigo-500 rounded-md text-zinc-300 hover:text-white transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 hover:bg-red-500 rounded-md text-zinc-300 hover:text-white transition-colors"
                        title="Sil"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="p-3 flex flex-col flex-1">
                <div className="mb-2">
                    <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {recipe.name}
                    </h3>
                    <div className="text-xs text-zinc-500">
                        {recipe.ingredients.length} Malzeme
                    </div>
                </div>

                <div className="space-y-2 mt-auto">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Maliyet</span>
                        <span className="font-mono text-zinc-300">{formatCurrency(recipe.totalCost)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-zinc-700/50 pt-2">
                        <div>
                            <span className="text-zinc-500">Satış</span>
                            <span className="text-[9px] text-green-500/60 ml-0.5">(KDV Dahil)</span>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-green-400 font-bold">{formatCurrency(recipe.calculatedPrice)}</span>
                            <div className="text-[9px] text-zinc-500 font-mono">Net: {formatCurrency(netPrice)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/40 px-3 py-1.5 flex justify-between items-center text-[10px] md:text-xs">
                <span className="bg-zinc-700/30 px-1.5 py-0.5 rounded text-zinc-400">
                    x{formatNumber(recipe.costMultiplier || 0)}
                </span>
                <div className="flex items-center gap-1 text-indigo-400 font-medium">
                    <TrendingUp size={12} />
                    %{profitMargin}
                </div>
            </div>
        </div>
    );
}

