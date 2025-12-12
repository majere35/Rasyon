import { Trash2, Edit2, TrendingUp } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
    recipe: Recipe;
    onEdit: (recipe: Recipe) => void;
    onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
    const profitMargin = recipe.calculatedPrice > 0
        ? ((recipe.calculatedPrice - recipe.totalCost) / recipe.calculatedPrice * 100).toFixed(1)
        : 0;

    return (
        <div className="group relative bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                        {recipe.name}
                    </h3>
                    <div className="text-xs text-zinc-500 mt-1">
                        {recipe.ingredients.length} Malzeme
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(recipe)}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(recipe.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-zinc-700/50 border-dashed">
                    <span className="text-sm text-zinc-400">Maliyet</span>
                    <span className="font-mono text-zinc-200">{recipe.totalCost.toFixed(2)} ₺</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-zinc-700/50 border-dashed">
                    <span className="text-sm text-zinc-400">Satış Fiyatı</span>
                    <span className="font-mono text-green-400 font-bold">{recipe.calculatedPrice.toFixed(2)} ₺</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span className="bg-zinc-700/50 px-2 py-0.5 rounded text-zinc-300">
                            x{recipe.costMultiplier}
                        </span>
                        <span>Çarpan</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-400 text-sm font-medium">
                        <TrendingUp size={14} />
                        %{profitMargin} Kâr
                    </div>
                </div>
            </div>
        </div>
    );
}
