import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, GripVertical, Pencil, Beaker, Link, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NumberInput } from './NumberInput';
import { toTitleCase } from '../lib/utils';
import type { IntermediateProduct, Ingredient } from '../types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AddIntermediateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    editProduct?: IntermediateProduct;
}

export function AddIntermediateProductModal({ isOpen, onClose, editProduct }: AddIntermediateProductModalProps) {
    const { addIntermediateProduct, updateIntermediateProduct, rawIngredients, intermediateProducts } = useStore();

    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [productionQuantity, setProductionQuantity] = useState(1);
    const [productionUnit, setProductionUnit] = useState<'kg' | 'lt' | 'adet'>('kg');
    const [portionWeight, setPortionWeight] = useState<number | undefined>(undefined);
    const [portionUnit, setPortionUnit] = useState<'gr' | 'cl'>('gr');

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
            setIngredients(editProduct.ingredients.map(ing => ({ ...ing, id: ing.id || crypto.randomUUID() })));
            setProductionQuantity(editProduct.productionQuantity);
            setProductionUnit(editProduct.productionUnit);
            setPortionWeight(editProduct.portionWeight);
            setPortionUnit(editProduct.portionUnit || (editProduct.productionUnit === 'lt' ? 'cl' : 'gr'));
        } else {
            setName('');
            setIngredients([{ id: crypto.randomUUID(), name: '', quantity: 0, unit: 'kg', price: 0 }]);
            setProductionQuantity(1);
            setProductionUnit('kg');
            setPortionWeight(undefined);
            setPortionUnit('gr');
        }
    }, [editProduct, isOpen]);

    const addIngredientRow = () => {
        setIngredients([...ingredients, { id: crypto.randomUUID(), name: '', quantity: 0, unit: 'kg', price: 0 }]);
    };

    const removeIngredientRow = (id: string) => {
        setIngredients(ingredients.filter((item) => item.id !== id));
    };

    const isIngredientLinked = (item: Ingredient) => {
        return !!item.rawIngredientId || !!item.intermediateProductId;
    };

    const handleEditIngredient = (id: string) => {
        const index = ingredients.findIndex(ing => ing.id === id);
        if (index === -1) return;

        const newIngredients = [...ingredients];
        newIngredients[index] = {
            ...newIngredients[index],
            rawIngredientId: undefined,
            intermediateProductId: undefined
        };
        setIngredients(newIngredients);
        // Trigger autocomplete for the now-editable field
        setActiveSearchIndex(index);
        setSearchQuery(''); // Clear query to show all options initially
        setShowSuggestions(true);
    };

    const updateIngredient = (id: string, field: keyof Ingredient, value: string | number | null) => {
        setIngredients(ingredients.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleIngredientSearch = (id: string, query: string) => {
        const index = ingredients.findIndex(ing => ing.id === id);
        if (index === -1) return;
        updateIngredient(id, 'name', query);
        setSearchQuery(query);
        setActiveSearchIndex(index);
        setShowSuggestions(true);
    };

    const selectRawIngredient = (id: string, rawIngredient: any) => {
        setIngredients(ingredients.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    name: rawIngredient.name,
                    unit: rawIngredient.unit,
                    price: rawIngredient.price,
                    rawIngredientId: rawIngredient.id,
                    intermediateProductId: undefined
                };
            }
            return item;
        }));
        setShowSuggestions(false);
        setActiveSearchIndex(null);
    };

    const selectIntermediateProduct = (id: string, product: IntermediateProduct) => {
        setIngredients(ingredients.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    name: product.name,
                    unit: product.productionUnit as any, // Assuming productionUnit can be used as ingredient unit
                    price: product.costPerUnit,
                    rawIngredientId: undefined,
                    intermediateProductId: product.id
                };
            }
            return item;
        }));
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
            ingredients: ingredients.map(i => ({ ...i, id: i.id || crypto.randomUUID() })) as Ingredient[],
            totalCost,
            productionQuantity,
            productionUnit,
            costPerUnit,
            portionWeight: productionUnit !== 'adet' ? portionWeight : undefined,
            portionUnit: productionUnit !== 'adet' ? portionUnit : undefined
        };

        if (editProduct) {
            updateIntermediateProduct(editProduct.id, productData);
        } else {
            addIntermediateProduct(productData);
        }
        onClose();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setIngredients((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

                            {/* Portioning Section */}
                            {productionUnit !== 'adet' && (
                                <div className="space-y-1 bg-orange-500/5 border border-orange-500/10 rounded-lg p-3">
                                    <label className="text-xs font-semibold text-orange-500/80 uppercase tracking-wider flex justify-between">
                                        <span>Porsiyonlama (Opsiyonel)</span>
                                    </label>
                                    <p className="text-[10px] text-zinc-500 mb-2">
                                        Ürünü reçetelerde "Adet" olarak kullanmak istiyorsanız bir porsiyonun ağırlığını girin.
                                    </p>
                                    <div className="flex gap-2">
                                        <NumberInput
                                            value={portionWeight || 0}
                                            onChange={(val) => setPortionWeight(val > 0 ? val : undefined)}
                                            className="flex-1"
                                            placeholder="Örn: 150"
                                            step={1}
                                        />
                                        <select
                                            value={portionUnit}
                                            onChange={(e) => setPortionUnit(e.target.value as 'gr' | 'cl')}
                                            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 text-sm"
                                        >
                                            <option value="gr">gr</option>
                                            <option value="cl">cl</option>
                                        </select>
                                    </div>
                                    {portionWeight && (
                                        <p className="text-[10px] text-orange-400/70 mt-1 font-medium">
                                            1 Adet Maliyeti: ~{((costPerUnit / (portionUnit === 'gr' ? 1000 : 100)) * portionWeight).toFixed(2)}₺
                                        </p>
                                    )}
                                </div>
                            )}

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
                                            <th className="px-3 py-2 text-xs uppercase tracking-wider pl-4 w-8"></th>
                                            <th className="px-3 py-2 text-xs uppercase tracking-wider">Malzeme</th>
                                            <th className="px-2 py-2 w-16 text-xs uppercase tracking-wider">Miktar</th>
                                            <th className="px-2 py-2 w-14 text-xs uppercase tracking-wider">Birim</th>
                                            <th className="px-2 py-2 w-20 text-xs uppercase tracking-wider">Birim Fiyat</th>
                                            <th className="px-2 py-2 w-18 text-xs uppercase tracking-wider text-right">Tutar</th>
                                            <th className="px-2 py-2 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={ingredients.map(i => i.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {ingredients.map((item, index) => (
                                                    <SortableIngredientRow
                                                        key={item.id}
                                                        item={item}
                                                        index={index}
                                                        isIngredientLinked={isIngredientLinked}
                                                        handleIngredientSearch={handleIngredientSearch}
                                                        setActiveSearchIndex={setActiveSearchIndex}
                                                        setSearchQuery={setSearchQuery}
                                                        setShowSuggestions={setShowSuggestions}
                                                        updateIngredient={updateIngredient}
                                                        removeIngredientRow={removeIngredientRow}
                                                        handleEditIngredient={handleEditIngredient}
                                                        showSuggestions={showSuggestions}
                                                        activeSearchIndex={activeSearchIndex}
                                                        searchRef={searchRef}
                                                        filteredIntermediateProducts={filteredIntermediateProducts}
                                                        filteredRawIngredients={filteredRawIngredients}
                                                        selectIntermediateProduct={selectIntermediateProduct}
                                                        selectRawIngredient={selectRawIngredient}
                                                        intermediateProducts={intermediateProducts}
                                                        searchQuery={searchQuery}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                        {ingredients.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-zinc-600 text-sm">
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

interface SortableIngredientRowProps {
    item: Ingredient;
    index: number;
    isIngredientLinked: (item: Ingredient) => boolean;
    handleIngredientSearch: (id: string, query: string) => void;
    setActiveSearchIndex: (index: number | null) => void;
    setSearchQuery: (query: string) => void;
    setShowSuggestions: (show: boolean) => void;
    updateIngredient: (id: string, field: keyof Ingredient, value: string | number | null) => void;
    removeIngredientRow: (id: string) => void;
    handleEditIngredient: (id: string) => void;
    showSuggestions: boolean;
    activeSearchIndex: number | null;
    searchRef: React.RefObject<HTMLDivElement | null>;
    filteredIntermediateProducts: any[];
    filteredRawIngredients: any[];
    selectIntermediateProduct: (id: string, product: any) => void;
    selectRawIngredient: (id: string, rawIngredient: any) => void;
    intermediateProducts: IntermediateProduct[];
    searchQuery: string;
}

function SortableIngredientRow({
    item,
    index,
    isIngredientLinked,
    handleIngredientSearch,
    setActiveSearchIndex,
    setSearchQuery,
    setShowSuggestions,
    updateIngredient,
    removeIngredientRow,
    handleEditIngredient,
    showSuggestions,
    activeSearchIndex,
    searchRef,
    filteredIntermediateProducts,
    filteredRawIngredients,
    selectIntermediateProduct,
    selectRawIngredient,
    intermediateProducts,
    searchQuery
}: SortableIngredientRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const zIndex = isDragging ? 50 : (activeSearchIndex === index ? 40 : 10);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex,
        position: 'relative' as const,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`group hover:bg-zinc-800/30 transition-colors ${isDragging ? 'bg-zinc-800/50 shadow-2xl' : ''} ${activeSearchIndex === index ? 'bg-zinc-800/20' : ''}`}
        >
            <td className="p-2 pl-4">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1"
                >
                    <GripVertical size={16} />
                </button>
            </td>
            <td className="p-2 relative">
                <div className="relative">
                    <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleIngredientSearch(item.id, e.target.value)}
                        onFocus={() => {
                            if (!isIngredientLinked(item)) {
                                setActiveSearchIndex(index);
                                // If it's empty or we want to show all on focus:
                                if (!item.name) setSearchQuery('');
                                else setSearchQuery(item.name);
                                setShowSuggestions(true);
                            }
                        }}
                        readOnly={isIngredientLinked(item)}
                        placeholder="Malzeme adı..."
                        className={`w-full bg-transparent border-dashed border-b p-0 text-sm pb-1 focus:ring-0 ${item.intermediateProductId
                            ? 'text-orange-400 font-medium border-transparent'
                            : item.rawIngredientId
                                ? 'text-indigo-400 font-medium border-transparent'
                                : 'text-zinc-200 border-zinc-700 placeholder-zinc-700 focus:border-indigo-500'
                            }`}
                    />
                    {item.rawIngredientId && (
                        <Link size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-500/50" />
                    )}
                    {item.intermediateProductId && (
                        <Link size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-orange-500/50" />
                    )}
                </div>

                {/* Auto-complete Dropdown */}
                {showSuggestions && activeSearchIndex === index && !isIngredientLinked(item) && (
                    <div ref={searchRef} className="absolute left-0 top-full mt-1 w-80 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl z-[100] overflow-hidden max-h-72 overflow-y-auto ring-1 ring-black/50">
                        {/* Search Bar in Dropdown */}
                        <div className="p-2 border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-20 backdrop-blur-md">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Malzeme ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()} // Prevent DND keyboard interference
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Intermediate Products Section */}
                        {filteredIntermediateProducts.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 bg-orange-500/10 border-b border-zinc-700 text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                                    Ara Ürünler
                                </div>
                                {filteredIntermediateProducts.map(ip => (
                                    <div
                                        key={ip.id}
                                        onClick={() => selectIntermediateProduct(item.id, ip)}
                                        className="px-3 py-2 hover:bg-orange-500/10 cursor-pointer text-sm text-zinc-300 flex justify-between items-center group border-l-2 border-transparent hover:border-orange-500"
                                    >
                                        <span className="text-orange-300">{ip.name}</span>
                                        <span className="text-xs text-orange-500/70 font-mono group-hover:text-orange-400">
                                            {ip.costPerUnit.toFixed(2)}₺/{ip.productionUnit}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Raw Ingredients Section */}
                        {filteredRawIngredients.length > 0 && (
                            <>
                                <div className="px-3 py-1.5 bg-indigo-500/10 border-b border-zinc-700 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                                    Hammaddeler
                                </div>
                                {filteredRawIngredients.map(ri => (
                                    <div
                                        key={ri.id}
                                        onClick={() => selectRawIngredient(item.id, ri)}
                                        className="px-3 py-2 hover:bg-indigo-500/10 cursor-pointer text-sm text-zinc-300 flex justify-between items-center group border-l-2 border-transparent hover:border-indigo-500"
                                    >
                                        <span>{ri.name}</span>
                                        <span className="text-xs text-zinc-500 font-mono group-hover:text-zinc-400">
                                            {ri.price.toFixed(2)}₺/kg
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* No Results */}
                        {filteredRawIngredients.length === 0 && filteredIntermediateProducts.length === 0 && (
                            <div className="px-3 py-2 text-xs text-zinc-500">Sonuç bulunamadı</div>
                        )}
                    </div>
                )}
            </td>
            <td className="p-2">
                <NumberInput
                    value={item.quantity}
                    onChange={(val) => updateIngredient(item.id, 'quantity', val)}
                    className="w-full"
                    placeholder="0"
                    step={0.001}
                />
            </td>
            <td className="p-2">
                {item.rawIngredientId || (item.intermediateProductId && !intermediateProducts.find(p => p.id === item.intermediateProductId)?.portionWeight) ? (
                    <div className={`text-sm px-1 py-1 ${item.intermediateProductId ? 'text-orange-400' : 'text-zinc-400'}`}>{item.unit}</div>
                ) : (
                    <select
                        value={item.unit}
                        onChange={(e) => updateIngredient(item.id, 'unit', e.target.value)}
                        className="w-full bg-zinc-800/50 rounded px-1 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs"
                    >
                        {item.intermediateProductId ? (
                            <>
                                <option value="adet">Adet</option>
                                <option value={intermediateProducts.find(p => p.id === item.intermediateProductId)?.productionUnit}>
                                    {intermediateProducts.find(p => p.id === item.intermediateProductId)?.productionUnit}
                                </option>
                            </>
                        ) : (
                            <>
                                <option value="adet">Adet</option>
                                <option value="kg">Kg</option>
                                <option value="gr">Gr</option>
                                <option value="lt">Lt</option>
                                <option value="cl">Cl</option>
                            </>
                        )}
                    </select>
                )}
            </td>
            <td className="p-2">
                {isIngredientLinked(item) ? (
                    <div className={`font-mono text-sm px-1 opacity-70 cursor-not-allowed ${item.intermediateProductId ? 'text-orange-400' : 'text-zinc-400'}`}>
                        {item.price.toFixed(2)}
                    </div>
                ) : (
                    <NumberInput
                        value={item.price}
                        onChange={(val) => updateIngredient(item.id, 'price', val)}
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
                <div className="flex items-center justify-center gap-1">
                    {isIngredientLinked(item) && (
                        <button
                            onClick={() => handleEditIngredient(item.id)}
                            className="text-zinc-600 hover:text-indigo-400 transition-colors p-1"
                            title="Malzemeyi Değiştir"
                        >
                            <Pencil size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => removeIngredientRow(item.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        title="Sil"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
