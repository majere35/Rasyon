import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, Beaker, Link } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NumberInput } from './NumberInput';
import { toTitleCase } from '../lib/utils';
import type { IntermediateProduct, Ingredient } from '../types';

interface AddIntermediateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    editProduct?: IntermediateProduct;
}

export function AddIntermediateProductModal({ isOpen, onClose, editProduct }: AddIntermediateProductModalProps) {
    const { addIntermediateProduct, updateIntermediateProduct, rawIngredients, intermediateProducts } = useStore();

    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id'>[]>([]);
    const [productionQuantity, setProductionQuantity] = useState(1);
    const [productionUnit, setProductionUnit] = useState<'kg' | 'lt' | 'adet'>('kg');

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

    useEffect(() => {
        if (editProduct) {
            setName(editProduct.name);
            setIngredients(editProduct.ingredients);
            setProductionQuantity(editProduct.productionQuantity);
            setProductionUnit(editProduct.productionUnit);
        } else {
            setName('');
            setIngredients([{ name: '', quantity: 0, unit: 'kg', price: 0 }]);
            setProductionQuantity(1);
            setProductionUnit('kg');
        }
    }, [editProduct, isOpen]);

    const addIngredientRow = () => {
        setIngredients([...ingredients, { name: '', quantity: 0, unit: 'kg', price: 0 }]);
    };

    const removeIngredientRow = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: keyof Omit<Ingredient, 'id'> | 'rawIngredientId', value: string | number | null) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);
    };

    const handleIngredientSearch = (index: number, query: string) => {
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
            rawIngredientId: rawIngredient.id,
            intermediateProductId: undefined
        };
        setIngredients(newIngredients);
        setShowSuggestions(false);
        setActiveSearchIndex(null);
    };

    const selectIntermediateProduct = (index: number, product: IntermediateProduct) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = {
            ...newIngredients[index],
            name: product.name,
            unit: product.productionUnit as any,
            price: product.costPerUnit,
            rawIngredientId: undefined,
            intermediateProductId: product.id
        };
        setIngredients(newIngredients);
        setShowSuggestions(false);
        setActiveSearchIndex(null);
    };

    const filteredRawIngredients = searchQuery
        ? rawIngredients.filter(ri => ri.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : rawIngredients;

    const filteredIntermediateProducts = searchQuery
        ? intermediateProducts
            .filter(ip => ip.id !== editProduct?.id) // Prevent self-nesting
            .filter(ip => ip.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : intermediateProducts.filter(ip => ip.id !== editProduct?.id);

    const calculateTotalQuantity = () => {
        return ingredients.reduce((sum, item) => {
            let qty = item.quantity || 0;
            // Convert to production unit if needed
            if (productionUnit === 'kg' && item.unit === 'gr') {
                qty = qty / 1000;
            } else if (productionUnit === 'lt' && item.unit === 'cl') {
                qty = qty / 100;
            } else if (productionUnit === 'kg' && item.unit === 'lt') {
                // assume 1lt = 1kg for kitchen math if not specified
                qty = qty;
            } else if (productionUnit === 'lt' && item.unit === 'kg') {
                qty = qty;
            }
            return sum + qty;
        }, 0);
    };

    // Auto-sync production quantity when ingredients or unit changes
    const calculateTotalCost = () => {
        return ingredients.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    // Auto-sync production quantity when ingredients or unit changes
    useEffect(() => {
        const totalQty = calculateTotalQuantity();
        if (totalQty > 0) {
            setProductionQuantity(totalQty);
        }
    }, [ingredients, productionUnit]);

    const totalCost = calculateTotalCost();
    const costPerUnit = productionQuantity > 0 ? totalCost / productionQuantity : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const productData: IntermediateProduct = {
            id: editProduct?.id || crypto.randomUUID(),
            name,
            ingredients: ingredients.map(i => ({ ...i, id: crypto.randomUUID() })) as Ingredient[],
            totalCost,
            productionQuantity,
            productionUnit,
            costPerUnit
        };

        if (editProduct) {
            updateIntermediateProduct(editProduct.id, productData);
        } else {
            addIntermediateProduct(productData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-zinc-800 w-full max-w-4xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Beaker size={20} className="text-orange-500" />
                        {editProduct ? 'Ara Ürün Düzenle' : 'Yeni Ara Ürün'}
                        <span className="text-zinc-500 font-normal text-sm hidden sm:inline px-2">|</span>
                        <span className="text-zinc-400 font-normal text-sm hidden sm:inline">{name || 'İsimsiz'}</span>
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-500">
                            Birim Maliyet: <span className="text-orange-400 font-mono font-bold">{costPerUnit.toFixed(2)}₺/{productionUnit}</span>
                        </div>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* LEFT COLUMN: Info (4 cols) */}
                        <div className="lg:col-span-4 space-y-4">
                            {/* Name Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ara Ürün Adı</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(toTitleCase(e.target.value))}
                                    placeholder="Örn: Özel Sos Karışımı"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            {/* Production Quantity */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex justify-between">
                                    <span>Üretim Miktarı</span>
                                    <span className="text-[10px] text-orange-500/70 lowercase normal-case">Otomatik Hesaplanır</span>
                                </label>
                                <div className="flex gap-2">
                                    <NumberInput
                                        value={productionQuantity}
                                        onChange={(val) => setProductionQuantity(val)}
                                        className="flex-1 bg-zinc-900/50 border-zinc-800 text-zinc-400"
                                        placeholder="5"
                                        step={0.001}
                                        readOnly={true}
                                    />
                                    <select
                                        value={productionUnit}
                                        onChange={(e) => setProductionUnit(e.target.value as 'kg' | 'lt' | 'adet')}
                                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="kg">Kg</option>
                                        <option value="lt">Lt</option>
                                        <option value="adet">Adet</option>
                                    </select>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-1">
                                    Listeye malzeme ekledikçe toplam miktar güncellenir
                                </p>
                            </div>

                            {/* Cost Summary Box */}
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3 mt-4">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <span className="text-sm text-zinc-400">Toplam Maliyet</span>
                                    <span className="font-mono text-white font-bold">{totalCost.toFixed(2)}₺</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-400">Birim Maliyet</span>
                                    <span className="font-mono text-orange-400 font-bold text-lg">
                                        {costPerUnit.toFixed(2)}₺/{productionUnit}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-600 pt-2 border-t border-zinc-800">
                                    Reçetelerde bu ara ürünü kullandığınızda bu birim maliyet uygulanacak
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Ingredients (8 cols) */}
                        <div className="lg:col-span-8 flex flex-col h-full bg-zinc-900/20 border border-zinc-800/50 rounded-xl overflow-hidden">
                            <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-2 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-zinc-300">Ara Ürün Malzemeleri</h3>
                                <button onClick={addIngredientRow} type="button" className="text-orange-400 text-xs hover:text-orange-300 flex items-center gap-1 font-medium bg-orange-500/10 px-2 py-1 rounded hover:bg-orange-500/20 transition-colors">
                                    <Plus size={14} /> Satır Ekle
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-900/80 text-zinc-500 font-medium sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-3 py-2 text-xs uppercase tracking-wider pl-4">Malzeme</th>
                                            <th className="px-2 py-2 w-28 text-xs uppercase tracking-wider">Miktar</th>
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
                                                            readOnly={!!item.rawIngredientId || !!item.intermediateProductId}
                                                            placeholder="Malzeme adı..."
                                                            className={`w-full bg-transparent border-dashed border-b p-0 text-sm pb-1 focus:ring-0 ${item.rawIngredientId || item.intermediateProductId
                                                                ? 'text-orange-400 font-medium border-transparent'
                                                                : 'text-zinc-200 border-zinc-700 placeholder-zinc-700 focus:border-orange-500'
                                                                }`}
                                                        />
                                                        {item.rawIngredientId && (
                                                            <Link size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-orange-500/50" />
                                                        )}
                                                        {item.intermediateProductId && (
                                                            <Beaker size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-orange-500/50" />
                                                        )}
                                                    </div>

                                                    {/* Auto-complete Dropdown */}
                                                    {showSuggestions && activeSearchIndex === index && !item.rawIngredientId && !item.intermediateProductId && (
                                                        <div ref={searchRef} className="absolute left-0 top-full mt-1 w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                                                            {/* Intermediate Products Section */}
                                                            {filteredIntermediateProducts.length > 0 && (
                                                                <div className="border-b border-zinc-800">
                                                                    <div className="px-3 py-1.5 bg-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                                                        <Beaker size={10} /> Ara Ürünler
                                                                    </div>
                                                                    {filteredIntermediateProducts.map(ip => (
                                                                        <div
                                                                            key={ip.id}
                                                                            onClick={() => selectIntermediateProduct(index, ip)}
                                                                            className="px-3 py-2 hover:bg-orange-500/10 cursor-pointer text-sm text-zinc-300 flex justify-between items-center group transition-colors"
                                                                        >
                                                                            <span className="group-hover:text-orange-400">{ip.name}</span>
                                                                            <span className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400">
                                                                                {ip.costPerUnit.toFixed(2)}₺/{ip.productionUnit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Raw Ingredients Section */}
                                                            {filteredRawIngredients.length > 0 && (
                                                                <div>
                                                                    <div className="px-3 py-1.5 bg-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                                                        <Link size={10} /> Hammaddeler
                                                                    </div>
                                                                    {filteredRawIngredients.map(ri => (
                                                                        <div
                                                                            key={ri.id}
                                                                            onClick={() => selectRawIngredient(index, ri)}
                                                                            className="px-3 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300 flex justify-between items-center group transition-colors"
                                                                        >
                                                                            <span>{ri.name}</span>
                                                                            <span className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400">
                                                                                {ri.price.toFixed(2)}₺/{ri.unit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {filteredRawIngredients.length === 0 && filteredIntermediateProducts.length === 0 && (
                                                                <div className="px-3 py-4 text-center text-xs text-zinc-500">Sonuç bulunamadı</div>
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
                                                    {item.rawIngredientId || item.intermediateProductId ? (
                                                        <div className="text-zinc-400 text-sm px-1 py-1">{item.unit}</div>
                                                    ) : (
                                                        <select
                                                            value={item.unit}
                                                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                                            className="w-full bg-zinc-800/50 rounded px-1 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/50 text-xs"
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
                                                    {item.rawIngredientId || item.intermediateProductId ? (
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
                                                    )}
                                                </td>
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

                            {/* Table Footer */}
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
                        className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all flex items-center gap-2 text-sm"
                    >
                        <Save size={16} />
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
