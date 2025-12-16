import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import type { RawIngredient } from '../types';

interface IngredientSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (ingredient: RawIngredient) => void;
}

export function IngredientSelectModal({ isOpen, onClose, onSelect }: IngredientSelectModalProps) {
    const { rawIngredients, ingredientCategories } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredIngredients = useMemo(() => {
        return rawIngredients.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
            return matchesSearch && matchesCategory;
        });
    }, [rawIngredients, searchQuery, selectedCategory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-zinc-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-white">Hammadde Ekle</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 space-y-4 bg-[#18181b]">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Hammadde ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === null
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                        >
                            Tümü
                        </button>
                        {ingredientCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${selectedCategory === cat.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredIngredients.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                            Sonuç bulunamadı.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredIngredients.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 hover:border-indigo-500/30 transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${ingredientCategories.find(c => c.id === item.categoryId)?.color || 'bg-zinc-500'
                                            }`} />
                                        <div>
                                            <div className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                {formatCurrency(item.price)} / {item.unit}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-zinc-600 group-hover:text-indigo-500 transition-colors">
                                        <Check size={18} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
