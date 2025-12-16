import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, Upload, Image as ImageIcon, Link, Copy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NumberInput } from './NumberInput';
import type { Recipe, Ingredient } from '../types';

interface AddRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    editRecipe?: Recipe;
}

export function AddRecipeModal({ isOpen, onClose, editRecipe }: AddRecipeModalProps) {
    const { addRecipe, updateRecipe, rawIngredients, recipes } = useStore();
    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id'>[]>([]);
    const [costMultiplier, setCostMultiplier] = useState(2.5);
    const [image, setImage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Copy Modal State
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copySourceId, setCopySourceId] = useState<string>('');

    // Autocomplete state
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
                setActiveSearchIndex(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    // Local state for price input to prevent cursor jump/formatting issues while typing
    const [localPrice, setLocalPrice] = useState<string | null>(null);

    useEffect(() => {
        if (editRecipe) {
            setName(editRecipe.name);
            setIngredients(editRecipe.ingredients);
            setCostMultiplier(editRecipe.costMultiplier);
            setImage(editRecipe.image || '');
        } else {
            setName('');
            setIngredients([{ name: '', quantity: 1, unit: 'adet', price: 0 }]);
            setCostMultiplier(2.5);
            setImage('');
        }
        setLocalPrice(null); // Reset local price on open/change
    }, [editRecipe, isOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const setIngredientsWithFixedPrice = (newIngredients: typeof ingredients) => {
        const currentTotal = ingredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const newTotal = newIngredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        // If we have a valid price established (total > 0), try to maintain it
        // by adjusting the multiplier
        if (currentTotal > 0 && newTotal > 0) {
            const currentPrice = currentTotal * costMultiplier;
            const newMultiplier = currentPrice / newTotal;
            setCostMultiplier(newMultiplier);
        }

        setIngredients(newIngredients);
    };

    const addIngredientRow = () => {
        // Adding 0 cost item won't change total or multiplier
        setIngredientsWithFixedPrice([...ingredients, { name: '', quantity: 0, unit: 'kg', price: 0 }]);
    };

    const removeIngredientRow = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredientsWithFixedPrice(newIngredients);
    };

    const updateIngredient = (index: number, field: keyof Omit<Ingredient, 'id'> | 'rawIngredientId', value: string | number | null) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredientsWithFixedPrice(newIngredients);
    };

    const handleIngredientSearch = (index: number, query: string) => {
        // If it was linked, unlink it when user types (or maybe prevent typing if linked? User said "editlenebilir olmasın")
        // User said: "listeden seçtiğimizde de editlenebilir olmasın"
        // This input should be readOnly if rawIngredientId is present.
        // So this handler will only trigger for non-linked items OR if we allow clearing.

        updateIngredient(index, 'name', query);
        setSearchQuery(query);
        setActiveSearchIndex(index);
        setShowSuggestions(true);
    };

    const selectRawIngredient = (index: number, rawIngredient: any) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = {
            ...newIngredients[index],
            name: rawIngredient.name,
            unit: rawIngredient.unit,
            price: rawIngredient.price,
            rawIngredientId: rawIngredient.id
        };
        setIngredientsWithFixedPrice(newIngredients);
        setShowSuggestions(false);
        setActiveSearchIndex(null);
    };

    const filteredRawIngredients = searchQuery
        ? rawIngredients.filter(ri => ri.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : rawIngredients;



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
            calculatedPrice,
            image
        };

        if (editRecipe) {
            updateRecipe(editRecipe.id, recipeData);
        } else {
            addRecipe(recipeData);
        }
        onClose();
    };

    const handleCopyRecipe = () => {
        if (!copySourceId) return;

        const sourceRecipe = recipes.find(r => r.id === copySourceId);
        if (sourceRecipe) {
            // Map ingredients to new objects to avoid reference issues
            // but PRESERVE rawIngredientId to keep the link to global stock
            const copiedIngredients = sourceRecipe.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                price: ing.price,
                rawIngredientId: ing.rawIngredientId // Crucial: Maintain the link
            }));

            setIngredientsWithFixedPrice(copiedIngredients);
            setIsCopyModalOpen(false);
            setCopySourceId('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-zinc-800 w-full max-w-5xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Compact Header */}
                <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        {editRecipe ? 'Düzenle' : 'Yeni Reçete'}
                        <span className="text-zinc-500 font-normal text-sm hidden sm:inline px-2">|</span>
                        <span className="text-zinc-400 font-normal text-sm hidden sm:inline">{name || 'İsimsiz Ürün'}</span>
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-500">
                            Maliyet: <span className="text-zinc-300 font-mono">{totalCost.toFixed(2)}₺</span>
                        </div>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                        {/* LEFT COLUMN: Info & Image (4 cols) */}
                        <div className="lg:col-span-4 space-y-6 flex flex-col">
                            {/* Image Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ürün Görseli</label>
                                <div
                                    className={`relative aspect-square rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 overflow-hidden group transition-colors hover:border-zinc-500 cursor-pointer flex flex-col items-center justify-center ${!image ? 'hover:bg-zinc-800' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {image ? (
                                        <>
                                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <div className="flex flex-col items-center text-white">
                                                    <Upload size={24} className="mb-1" />
                                                    <span className="text-xs">Değiştir</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                            <ImageIcon size={32} className="mb-2" />
                                            <span className="text-sm font-medium">Görsel Yükle</span>
                                            <span className="text-xs opacity-60">veya sürükle bırak</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                {image && (
                                    <button
                                        onClick={() => setImage('')}
                                        className="text-xs text-red-400 hover:text-red-300 w-full text-center"
                                    >
                                        Görseli Kaldır
                                    </button>
                                )}
                            </div>

                            {/* Name Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ürün Adı</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Gravity Burger"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Multiplier & Pricing - Compact Box */}
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-4 mt-auto">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <span className="text-sm text-zinc-400">Maliyet Çarpanı</span>
                                    <span className="font-mono text-white font-bold bg-zinc-700/50 px-2 py-0.5 rounded">x{costMultiplier.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="0.1"
                                        value={costMultiplier}
                                        onChange={(e) => setCostMultiplier(parseFloat(e.target.value))}
                                        className="flex-1 accent-indigo-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-zinc-500">Hesaplanan Satış Fiyatı</span>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className="w-32 bg-transparent text-right text-xl font-bold text-green-400 font-mono focus:outline-none border-b border-transparent focus:border-green-500/50 transition-all placeholder-green-400/30"
                                                value={localPrice !== null ? localPrice : calculatedPrice.toFixed(2)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setLocalPrice(val); // Always update text first for smooth typing

                                                    const newPrice = parseFloat(val);
                                                    if (!isNaN(newPrice) && totalCost > 0) {
                                                        setCostMultiplier(newPrice / totalCost);
                                                    }
                                                }}
                                                onBlur={() => setLocalPrice(null)} // Snap back to formatted value
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <span className="absolute right-0 top-full text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Çarpanı otomatik günceller
                                            </span>
                                            <span className="text-xl font-bold text-green-400 font-mono ml-1">₺</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-zinc-500">Kâr Oranı</span>
                                        <span className="text-xs text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded">
                                            %{((calculatedPrice - totalCost) / calculatedPrice * 100 || 0).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Ingredients (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col h-full bg-zinc-900/20 border border-zinc-800/50 rounded-xl overflow-hidden">
                            <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-2 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-zinc-300">Reçete Malzemeleri</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsCopyModalOpen(true)}
                                        type="button"
                                        className="text-zinc-400 text-xs hover:text-white flex items-center gap-1 font-medium bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                                    >
                                        <Copy size={14} /> Reçeteden Kopyala
                                    </button>
                                    <button onClick={addIngredientRow} type="button" className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors">
                                        <Plus size={14} /> Satır Ekle
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-900/80 text-zinc-500 font-medium sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-3 py-2 text-xs uppercase tracking-wider pl-4">Malzeme</th>
                                            <th className="px-2 py-2 w-32 text-xs uppercase tracking-wider">Miktar</th>
                                            <th className="px-2 py-2 w-20 text-xs uppercase tracking-wider">Birim</th>
                                            <th className="px-2 py-2 w-24 text-xs uppercase tracking-wider">Birim Fiyat</th>
                                            <th className="px-2 py-2 w-24 text-xs uppercase tracking-wider text-right">Tutar</th>
                                            <th className="px-2 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {ingredients.map((item, index) => (
                                            <tr key={index} className="group hover:bg-zinc-800/30 transition-colors">
                                                <td className="p-2 pl-4 relative">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => handleIngredientSearch(index, e.target.value)}
                                                            onFocus={() => {
                                                                if (!item.rawIngredientId) {
                                                                    setActiveSearchIndex(index);
                                                                    setSearchQuery(item.name);
                                                                    setShowSuggestions(true);
                                                                }
                                                            }}
                                                            readOnly={!!item.rawIngredientId}
                                                            placeholder="Malzeme adı..."
                                                            className={`w-full bg-transparent border-dashed border-b p-0 text-sm pb-1 focus:ring-0 ${item.rawIngredientId
                                                                ? 'text-indigo-400 font-medium border-transparent'
                                                                : 'text-zinc-200 border-zinc-700 placeholder-zinc-700 focus:border-indigo-500'
                                                                }`}
                                                        />
                                                        {item.rawIngredientId && (
                                                            <Link size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-500/50" />
                                                        )}
                                                    </div>

                                                    {/* Auto-complete Dropdown */}
                                                    {showSuggestions && activeSearchIndex === index && !item.rawIngredientId && (
                                                        <div ref={searchRef} className="absolute left-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                                            {filteredRawIngredients.length > 0 ? (
                                                                filteredRawIngredients.map(ri => (
                                                                    <div
                                                                        key={ri.id}
                                                                        onClick={() => selectRawIngredient(index, ri)}
                                                                        className="px-3 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300 flex justify-between items-center group"
                                                                    >
                                                                        <span>{ri.name}</span>
                                                                        <span className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400">
                                                                            {ri.price.toFixed(2)}₺/{ri.unit}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="px-3 py-2 text-xs text-zinc-500">Sonuç bulunamadı</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <NumberInput
                                                        value={item.quantity}
                                                        onChange={(val) => updateIngredient(index, 'quantity', val)}
                                                        className="w-full"
                                                        placeholder="0"
                                                        step={0.001}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    {item.rawIngredientId ? (
                                                        <div className="text-zinc-400 text-sm px-1 py-1">{item.unit}</div>
                                                    ) : (
                                                        <select
                                                            value={item.unit}
                                                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                                            className="w-full bg-zinc-800/50 rounded px-1 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs"
                                                        >
                                                            <option value="adet">Adet</option>
                                                            <option value="kg">Kg</option>
                                                            <option value="gr">Gr</option>
                                                            <option value="lt">Lt</option>
                                                            <option value="cl">Cl</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {item.rawIngredientId ? (
                                                        <div className="text-zinc-400 font-mono text-sm px-1 opacity-70 cursor-not-allowed">
                                                            {item.price.toFixed(2)}
                                                        </div>
                                                    ) : (
                                                        <NumberInput
                                                            value={item.price}
                                                            onChange={(val) => updateIngredient(index, 'price', val)}
                                                            className="w-full"
                                                            placeholder="0.00"
                                                            step={0.001}
                                                        />
                                                    )}                                                </td>
                                                <td className="p-2 text-right font-mono text-zinc-400 text-sm">
                                                    {(item.quantity * item.price).toFixed(2)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => removeIngredientRow(index)}
                                                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {ingredients.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-zinc-600 text-sm">
                                                    Henüz malzeme eklenmedi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table Footer / Aggregates */}
                            <div className="bg-zinc-900/80 border-t border-zinc-800 p-3 flex justify-between items-center text-sm">
                                <span className="text-zinc-500 ml-2">{ingredients.length} Kalem Malzeme</span>
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="text-zinc-400">Toplam Maliyet:</span>
                                    <span className="font-mono text-white font-bold">{totalCost.toFixed(2)} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-medium text-sm"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 text-sm"
                    >
                        <Save size={16} />
                        Kaydet
                    </button>
                </div>
            </div>

            {/* Copy Recipe Modal */}
            {isCopyModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Copy size={20} className="text-indigo-500" />
                            Reçeteden Kopyala
                        </h3>
                        <p className="text-zinc-400 text-sm mb-4">
                            Aşağıdaki listeden içeriğini kopyalamak istediğiniz reçeteyi seçin. <strong className="text-red-400">Mevcut malzemeler silinecek</strong> ve seçilen reçetenin malzemeleri eklenecektir.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kaynak Reçete</label>
                                <select
                                    value={copySourceId}
                                    onChange={(e) => setCopySourceId(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 h-[42px]"
                                >
                                    <option value="">Reçete Seçin...</option>
                                    {recipes.filter(r => r.id !== editRecipe?.id).map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCopyModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyRecipe}
                                    disabled={!copySourceId}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                                >
                                    Kopyala
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
