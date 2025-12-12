import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Recipe, Ingredient } from '../types';

interface AddRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    editRecipe?: Recipe;
}

export function AddRecipeModal({ isOpen, onClose, editRecipe }: AddRecipeModalProps) {
    const { addRecipe, updateRecipe } = useStore();
    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id'>[]>([]);
    const [costMultiplier, setCostMultiplier] = useState(2.5);

    useEffect(() => {
        if (editRecipe) {
            setName(editRecipe.name);
            setIngredients(editRecipe.ingredients);
            setCostMultiplier(editRecipe.costMultiplier);
        } else {
            setName('');
            setIngredients([{ name: '', quantity: 1, unit: 'adet', price: 0 }]);
            setCostMultiplier(2.5);
        }
    }, [editRecipe, isOpen]);

    const addIngredientRow = () => {
        setIngredients([...ingredients, { name: '', quantity: 0, unit: 'kg', price: 0 }]);
    };

    const removeIngredientRow = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: keyof Omit<Ingredient, 'id'>, value: string | number) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    const calculateTotalCost = () => {
        return ingredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const totalCost = calculateTotalCost();
    const calculatedPrice = totalCost * costMultiplier;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const recipeData: Recipe = {
            id: editRecipe?.id || crypto.randomUUID(),
            name,
            ingredients: ingredients.map(i => ({ ...i, id: crypto.randomUUID() })) as Ingredient[],
            totalCost,
            costMultiplier,
            calculatedPrice
        };

        if (editRecipe) {
            updateRecipe(editRecipe.id, recipeData);
        } else {
            addRecipe(recipeData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="text-xl font-bold text-white">
                        {editRecipe ? 'Reçeteyi Düzenle' : 'Yeni Reçete Oluştur'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-zinc-400">Ürün Adı</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Örn: Gravity Burger"
                            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Ingredients Table */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="block text-sm font-medium text-zinc-400">Reçete Malzemeleri</label>
                            <button onClick={addIngredientRow} type="button" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors">
                                <Plus size={16} /> Satır Ekle
                            </button>
                        </div>

                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/80 text-zinc-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Malzeme Adı</th>
                                        <th className="px-4 py-3 font-medium w-24">Miktar</th>
                                        <th className="px-4 py-3 font-medium w-24">Birim</th>
                                        <th className="px-4 py-3 font-medium w-32">Birim Fiyat</th>
                                        <th className="px-4 py-3 font-medium w-32">Tutar</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {ingredients.map((item, index) => (
                                        <tr key={index} className="group hover:bg-zinc-800/30 transition-colors">
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                                    placeholder="Örn: Kıyma"
                                                    className="w-full bg-transparent border-none p-0 text-zinc-200 placeholder-zinc-700 focus:ring-0"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-zinc-800/50 rounded-lg px-2 py-1 text-center text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                                    className="w-full bg-zinc-800/50 rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                >
                                                    <option value="kg">kg</option>
                                                    <option value="lt">lt</option>
                                                    <option value="adet">adet</option>
                                                    <option value="gr">gr</option>
                                                    <option value="cl">cl</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateIngredient(index, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-zinc-800/50 rounded-lg px-2 py-1 text-right text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                />
                                            </td>
                                            <td className="p-3 text-right font-mono text-zinc-400">
                                                {(item.quantity * item.price).toFixed(2)} ₺
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => removeIngredientRow(index)}
                                                    className="text-zinc-600 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-col gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                            <div className="flex justify-between items-center text-zinc-400">
                                <span>Ara Toplam (Maliyet)</span>
                                <span className="font-mono text-white text-lg">{totalCost.toFixed(2)} ₺</span>
                            </div>

                            <div className="flex items-center gap-6 py-4 border-y border-zinc-800 border-dashed">
                                <div className="flex-1">
                                    <label className="block text-sm text-zinc-500 mb-1">Maliyet Çarpanı</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="0.1"
                                            value={costMultiplier}
                                            onChange={(e) => setCostMultiplier(parseFloat(e.target.value))}
                                            className="flex-1 accent-indigo-500"
                                        />
                                        <input
                                            type="number"
                                            value={costMultiplier}
                                            onChange={(e) => setCostMultiplier(parseFloat(e.target.value))}
                                            className="w-16 bg-zinc-800 rounded-lg p-2 text-center text-white font-bold border border-zinc-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-zinc-200 font-medium">Hesaplanan Satış Fiyatı</span>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-400 font-mono">
                                        {calculatedPrice.toFixed(2)} ₺
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">
                                        %{((calculatedPrice - totalCost) / calculatedPrice * 100 || 0).toFixed(1)} Kâr Marjı
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-medium"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
