import { useState } from 'react';
import { Plus, Search, Trash2, Tag, Edit2, AlertCircle, GripVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NumberInput } from '../components/NumberInput';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatCurrency } from '../lib/utils';
import type { RawIngredient, IngredientCategory } from '../types';
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

interface SortableItemProps {
    id: string;
    cat: IngredientCategory;
    selectedCategory: string | null;
    onSelect: (id: string) => void;
    onEdit: (cat: IngredientCategory) => void;
    onDelete: (id: string) => void;
    editingColorId: string | null;
    setEditingColorId: (id: string | null) => void;
    COLORS: string[];
    handleColorUpdate: (id: string, color: string) => void;
}

function SortableItem({
    id,
    cat,
    selectedCategory,
    onSelect,
    onEdit,
    onDelete,
    editingColorId,
    setEditingColorId,
    COLORS,
    handleColorUpdate
}: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center gap-1 ${isDragging ? 'opacity-50' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="w-6 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
            >
                <GripVertical size={14} />
            </div>
            <button
                onClick={() => onSelect(cat.id)}
                className={`flex-1 text-left pr-3 pl-1 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedCategory === cat.id
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
            >
                <div className="relative">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingColorId(editingColorId === cat.id ? null : cat.id);
                        }}
                        className={`w-3 h-3 rounded-full ${cat.color} hover:ring-2 ring-white/20 transition-all cursor-pointer shrink-0`}
                    ></div>

                    {editingColorId === cat.id && (
                        <div
                            className="absolute left-0 top-full mt-2 z-50 bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl p-3 w-48 animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="grid grid-cols-4 gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorUpdate(cat.id, color)}
                                        className={`w-8 h-8 rounded-full ${color} hover:scale-110 transition-transform ${cat.color === color ? 'ring-2 ring-white' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {editingColorId === cat.id && (
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setEditingColorId(null); }} />
                    )}
                </div>
                <span className="truncate">{cat.name}</span>
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
                    className="text-zinc-600 hover:text-indigo-400 transition-all p-1"
                >
                    <Edit2 size={12} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(cat.id); }}
                    className="text-zinc-600 hover:text-red-400 transition-all p-1"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

export function IngredientsView() {
    const {
        rawIngredients,
        ingredientCategories,
        addRawIngredient,
        updateRawIngredient,
        deleteRawIngredient,
        bulkDeleteRawIngredients,
        addIngredientCategory,
        updateIngredientCategory,
        deleteIngredientCategory,
        setIngredientCategories
    } = useStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Color Palette - 16 Colors (4x4)
    const COLORS = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
    ];

    // State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddMode, setIsAddMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<RawIngredient>>({
        name: '',
        price: 0,
        unit: 'kg',
        minimumStock: 0,
        packageQuantity: undefined,
        packageUnit: 'gr',
        packagePrice: undefined,
        vatRate: 0.01 // Default: %1 (Gıda KDV)
    });

    // Delete Modal
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'ingredient' | 'category' | 'bulk_ingredients' | null>(null);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Add Category Modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    // Color Popover State
    const [editingColorId, setEditingColorId] = useState<string | null>(null);

    // Editing Category State
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

    // Warning Modal
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    // Filtered Ingredients
    const filteredIngredients = rawIngredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    // Convert package quantity to base unit (kg or lt)
    const convertToBaseUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
        // Convert to grams/ml first
        let inSmallUnit = quantity;
        if (fromUnit === 'kg' || fromUnit === 'lt') {
            inSmallUnit = quantity * 1000;
        } else if (fromUnit === 'cl') {
            inSmallUnit = quantity * 10; // cl to ml
        }
        // gr/ml stays as is

        // Convert from grams/ml to target
        if (toUnit === 'kg' || toUnit === 'lt') {
            return inSmallUnit / 1000;
        } else if (toUnit === 'cl') {
            return inSmallUnit / 10;
        }
        return inSmallUnit; // gr or ml
    };

    // Calculate unit price from package
    const calculateUnitPrice = () => {
        const qty = formData.packageQuantity || 0;
        const price = formData.packagePrice || 0;
        const pkgUnit = formData.packageUnit || 'gr';
        const baseUnit = formData.unit || 'kg';

        if (qty > 0 && price > 0) {
            const quantityInBaseUnit = convertToBaseUnit(qty, pkgUnit, baseUnit);
            if (quantityInBaseUnit > 0) {
                return price / quantityInBaseUnit;
            }
        }
        return formData.price || 0;
    };

    // Computed unit price for display
    const computedUnitPrice = calculateUnitPrice();

    // Title case helper - capitalize first letter of each word (Turkish-safe)
    const toTitleCase = (str: string) => {
        return str
            .split(' ')
            .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : '')
            .join(' ');
    };

    // Check for duplicate ingredient name
    const isDuplicateName = (name: string, excludeId?: string) => {
        const normalizedName = name.trim().toLowerCase();
        return rawIngredients.some(item =>
            item.name.toLowerCase() === normalizedName && item.id !== excludeId
        );
    };

    // CRUD Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !selectedCategory) return;

        // Check for duplicate name
        if (isDuplicateName(formData.name, editingId || undefined)) {
            setWarningMessage('Bu isimde bir hammadde zaten mevcut. Lütfen farklı bir isim girin.');
            return;
        }

        // Calculate unit price from package if package data exists
        const unitPrice = formData.packageQuantity && formData.packagePrice
            ? calculateUnitPrice()
            : Number(formData.price);

        const ingredientData: RawIngredient = {
            id: editingId || crypto.randomUUID(),
            categoryId: selectedCategory,
            name: formData.name,
            price: unitPrice,
            unit: formData.unit as any || 'kg',
            minimumStock: Number(formData.minimumStock),
            packageQuantity: formData.packageQuantity,
            packageUnit: formData.packageUnit as any,
            packagePrice: formData.packagePrice,
            vatRate: formData.vatRate ?? 0.01
        };

        if (editingId) {
            updateRawIngredient(editingId, ingredientData);
            setEditingId(null);
        } else {
            addRawIngredient(ingredientData);
        }

        // Reset Form but keep category
        setFormData({ name: '', price: 0, unit: 'kg', minimumStock: 0, packageQuantity: undefined, packageUnit: 'gr', packagePrice: undefined, vatRate: 0.01 });
        setIsAddMode(false);
    };

    const handleEdit = (ingredient: RawIngredient) => {
        setFormData({
            name: ingredient.name,
            price: ingredient.price,
            unit: ingredient.unit,
            minimumStock: ingredient.minimumStock,
            packageQuantity: ingredient.packageQuantity,
            packageUnit: ingredient.packageUnit,
            packagePrice: ingredient.packagePrice,
            vatRate: ingredient.vatRate ?? 0.01
        });
        setEditingId(ingredient.id);
        setSelectedCategory(ingredient.categoryId);
        setIsAddMode(true);
    };

    const handleDeleteCategory = (id: string) => {
        // Check if category has ingredients
        const hasIngredients = rawIngredients.some(i => i.categoryId === id);
        if (hasIngredients) {
            setWarningMessage('Bu kategoriye tanımlı ürünler bulunmaktadır. Önce kategori içindeki tüm ürünlerin silinmesi gerekir.');
            return;
        }
        setDeleteId(id);
        setDeleteType('category');
    };

    const confirmDelete = () => {
        if (deleteType === 'bulk_ingredients') {
            bulkDeleteRawIngredients(Array.from(selectedIds));
            setSelectedIds(new Set());
        } else if (deleteId) {
            if (deleteType === 'ingredient') {
                deleteRawIngredient(deleteId);
                // Also remove from selection if selected
                if (selectedIds.has(deleteId)) {
                    const newSet = new Set(selectedIds);
                    newSet.delete(deleteId);
                    setSelectedIds(newSet);
                }
            } else if (deleteType === 'category') {
                deleteIngredientCategory(deleteId);
                if (selectedCategory === deleteId) setSelectedCategory(null);
            }
        }

        setDeleteId(null);
        setDeleteType(null);
    };

    // Bulk selection handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredIngredients.length && filteredIngredients.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredIngredients.map(i => i.id)));
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // Category Management
    const handleAddCategoryClick = () => {
        setEditingCategoryId(null);
        setNewCategoryName('');
        setSelectedColor(COLORS[0]);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: IngredientCategory) => {
        setEditingCategoryId(category.id);
        setNewCategoryName(category.name);
        setSelectedColor(category.color);
        setIsCategoryModalOpen(true);
    };

    const submitAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            if (editingCategoryId) {
                updateIngredientCategory(editingCategoryId, {
                    name: newCategoryName.trim(),
                    color: selectedColor
                });
            } else {
                addIngredientCategory({
                    id: crypto.randomUUID(),
                    name: newCategoryName.trim(),
                    color: selectedColor
                });
            }
            setIsCategoryModalOpen(false);
            setEditingCategoryId(null);
            setNewCategoryName('');
            setSelectedColor(COLORS[0]);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = ingredientCategories.findIndex((cat) => cat.id === active.id);
            const newIndex = ingredientCategories.findIndex((cat) => cat.id === over.id);

            setIngredientCategories(arrayMove(ingredientCategories, oldIndex, newIndex));
        }
    };

    const handleColorUpdate = (categoryId: string, color: string) => {
        updateIngredientCategory(categoryId, { color });
        setEditingColorId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Hammadde Yönetimi</h2>
                <p className="text-zinc-400">Reçetelerinizde kullanacağınız ürünleri ve fiyatlarını buradan yönetin.</p>
            </div>

            {/* Mobile Category Selector */}
            <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar flex gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === null
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                >
                    Tümü
                </button>
                {ingredientCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex-1 shadow-xl flex-col md:flex-row">

                {/* LEFT: Categories Sidebar (Desktop Only) */}
                <div className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <span className="font-semibold text-zinc-300 text-sm">Kategoriler</span>
                        <button onClick={handleAddCategoryClick} className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`w-full text-left pl-9 pr-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedCategory === null
                                ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <Tag size={14} /> Tüm Kategoriler
                        </button>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={ingredientCategories.map(cat => cat.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {ingredientCategories.map(cat => (
                                    <SortableItem
                                        key={cat.id}
                                        id={cat.id}
                                        cat={cat}
                                        selectedCategory={selectedCategory}
                                        onSelect={setSelectedCategory}
                                        onEdit={handleEditCategory}
                                        onDelete={handleDeleteCategory}
                                        editingColorId={editingColorId}
                                        setEditingColorId={setEditingColorId}
                                        COLORS={COLORS}
                                        handleColorUpdate={handleColorUpdate}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                {/* RIGHT: Main Content */}
                <div className="flex-1 flex flex-col bg-[#18181b]">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row md:items-center gap-4 bg-[#18181b]">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Hammadde ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors input-decimal"
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            {selectedCategory && (
                                <button
                                    onClick={() => {
                                        setIsAddMode(true);
                                        setEditingId(null);
                                        setFormData({ name: '', price: 0, unit: 'kg', minimumStock: 0 });
                                    }}
                                    className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    <Plus size={16} />
                                    <span className="md:hidden">Ekle</span>
                                    <span className="hidden md:inline">Yeni Hammadde</span>
                                </button>
                            )}

                            {/* Bulk Delete Button */}
                            {selectedIds.size > 0 && (
                                <button
                                    onClick={() => {
                                        setDeleteId('bulk'); // Dummy
                                        setDeleteType('bulk_ingredients');
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors animate-in fade-in"
                                >
                                    <Trash2 size={16} />
                                    <span className="md:hidden">Sil ({selectedIds.size})</span>
                                    <span className="hidden md:inline">Seçilenleri Sil ({selectedIds.size})</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Add/Edit Form Panel */}
                    {(isAddMode && selectedCategory) && (
                        <div className="border-b border-indigo-500/30 bg-indigo-500/5 p-4 animate-in slide-in-from-top-2">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Form content remains mostly same, just ensuring responsiveness */}
                                <div className="flex flex-col md:flex-row items-end gap-4">
                                    {editingId && (
                                        <div className="space-y-1 w-full md:w-40">
                                            <label className="text-xs font-semibold text-indigo-300 ml-1">Kategori</label>
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-white focus:border-indigo-500 outline-none text-sm h-[38px]"
                                            >
                                                {ingredientCategories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="space-y-1 flex-1 w-full md:min-w-[200px]">
                                        <label className="text-xs font-semibold text-indigo-300 ml-1">Ürün Adı</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: toTitleCase(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                            placeholder="Örn: Sarımsak Püresi"
                                        />
                                    </div>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <div className="space-y-1 w-1/2 md:w-24">
                                            <label className="text-xs font-semibold text-indigo-300 ml-1">Birim</label>
                                            <select
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-white focus:border-indigo-500 outline-none text-sm h-[38px]"
                                            >
                                                <option value="kg">Kg</option>
                                                <option value="lt">Lt</option>
                                                <option value="adet">Adet</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 w-1/2 md:w-24">
                                            <label className="text-xs font-semibold text-indigo-300 ml-1">KDV</label>
                                            <select
                                                value={formData.vatRate}
                                                onChange={e => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-white focus:border-indigo-500 outline-none text-sm h-[38px]"
                                            >
                                                <option value={0.01}>%1</option>
                                                <option value={0.10}>%10</option>
                                                <option value={0.20}>%20</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Package-based pricing */}
                                <div className="flex flex-col md:flex-row items-end gap-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                    <div className="text-xs text-zinc-500 w-full mb-1">
                                        📦 Ambalaj Bilgisi <span className="text-zinc-600">(birim fiyat otomatik hesaplanır)</span>
                                    </div>

                                    <div className="flex w-full gap-4">
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs font-semibold text-zinc-500 ml-1">Miktar</label>
                                            <NumberInput
                                                value={formData.packageQuantity || 0}
                                                onChange={val => setFormData({ ...formData, packageQuantity: val || undefined })}
                                                className="w-full bg-zinc-800"
                                                placeholder="350"
                                                step={1}
                                            />
                                        </div>
                                        <div className="space-y-1 w-24">
                                            <label className="text-xs font-semibold text-zinc-500 ml-1">Birim</label>
                                            <select
                                                value={formData.packageUnit}
                                                onChange={e => setFormData({ ...formData, packageUnit: e.target.value as any })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-white outline-none text-sm h-[38px]"
                                            >
                                                <option value="gr">Gr</option>
                                                <option value="kg">Kg</option>
                                                <option value="lt">Lt</option>
                                                <option value="cl">Cl</option>
                                                <option value="adet">Adet</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto">
                                        <label className="text-xs font-semibold text-zinc-500 ml-1">Ambalaj Fiyatı</label>
                                        <NumberInput
                                            value={formData.packagePrice || 0}
                                            onChange={val => setFormData({ ...formData, packagePrice: val || undefined })}
                                            className="w-full bg-zinc-800"
                                            placeholder="45"
                                            step={0.01}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 ml-2 w-full md:w-auto mt-2 md:mt-0">
                                        <span className="text-zinc-600 hidden md:inline">=</span>
                                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded px-3 py-2 w-full text-center md:w-auto">
                                            <span className="text-xs text-indigo-400">Birim Fiyat: </span>
                                            <span className="font-mono text-indigo-300 font-bold">
                                                {computedUnitPrice.toFixed(2)}₺/{formData.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Actions */}
                                <div className="flex justify-end gap-3 sticky bottom-0 bg-[#18181b] p-2 md:relative md:bg-transparent md:p-0">
                                    <button type="button" onClick={() => setIsAddMode(false)} className="text-zinc-400 hover:text-white px-4 py-2">
                                        İptal
                                    </button>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-medium">
                                        {editingId ? 'Güncelle' : 'Ekle'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-[#18181b]">
                        {filteredIngredients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                                <AlertCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-center px-4">{selectedCategory ? 'Bu kategoride hammadde yok.' : 'Kategori seçerek başlayın.'}</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <table className="hidden md:table w-full text-left text-sm">
                                    <thead className="bg-[#18181b] text-zinc-500 font-medium border-b border-zinc-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredIngredients.length > 0 && selectedIds.size === filteredIngredients.length}
                                                    onChange={toggleSelectAll}
                                                    className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </th>
                                            <th className="px-6 py-3 font-normal">Hammadde Adı</th>
                                            <th className="px-6 py-3 font-normal">Birim</th>
                                            <th className="px-6 py-3 font-normal text-right">Birim Fiyat</th>
                                            <th className="px-6 py-3 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {filteredIngredients.map(item => (
                                            <tr key={item.id} className={`group hover:bg-zinc-800/30 transition-colors ${selectedIds.has(item.id) ? 'bg-indigo-500/5' : ''}`}>
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(item.id)}
                                                        onChange={() => toggleSelectRow(item.id)}
                                                        className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-white font-medium">{item.name}</td>
                                                <td className="px-6 py-3 text-zinc-400">
                                                    <span className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-xs uppercase">
                                                        {item.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-indigo-300">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className="px-6 py-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-indigo-500/20 rounded transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteId(item.id); setDeleteType('ingredient'); }}
                                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-3 p-4 pb-24">
                                    {filteredIngredients.map(item => (
                                        <div
                                            key={item.id}
                                            className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 active:scale-[0.99] transition-transform ${selectedIds.has(item.id) ? 'ring-1 ring-indigo-500 bg-indigo-500/5' : ''}`}
                                            onClick={() => toggleSelectRow(item.id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(item.id)}
                                                        readOnly
                                                        className="rounded bg-zinc-800 border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-5 h-5 pointer-events-none"
                                                    />
                                                    <div>
                                                        <h4 className="font-bold text-white text-base leading-tight">{item.name}</h4>
                                                        <span className="text-xs text-zinc-500">
                                                            {item.packageQuantity ? `${item.packageQuantity} ${item.packageUnit}` : 'Dökme'} • %{(item.vatRate || 0.01) * 100} KDV
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-zinc-800 border border-zinc-700/50 px-2 py-1 rounded text-right">
                                                    <div className="font-mono text-indigo-300 font-bold text-sm">
                                                        {formatCurrency(item.price)}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 uppercase">
                                                        Birim: {item.unit}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800/50 mt-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                    className="flex items-center gap-2 text-zinc-400 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                    <span className="text-xs font-bold">Düzenle</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); setDeleteType('ingredient'); }}
                                                    className="flex items-center gap-2 text-red-400 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                    <span className="text-xs font-bold">Sil</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={!!deleteId}
                title={deleteType === 'category' ? 'Kategoriyi Sil' : deleteType === 'bulk_ingredients' ? 'Seçili Ürünleri Sil' : 'Hammaddeyi Sil'}
                message={
                    deleteType === 'category' ? 'Bu kategoriyi silmek istediğinize emin misiniz?' :
                        deleteType === 'bulk_ingredients' ? `Seçili ${selectedIds.size} hammaddeyi silmek istediğinize emin misiniz?` :
                            'Bu hammaddeyi silmek istediğinize emin misiniz?'
                }
                onConfirm={confirmDelete}
                onCancel={() => { setDeleteId(null); setDeleteType(null); }}
                type="danger"
            />
            {/* Category Add Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">
                            {editingCategoryId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
                        </h3>
                        <form onSubmit={submitAddCategory} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Kategori Adı</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Örn: Süt Ürünleri"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Renk Seçimi</label>
                                <div className="grid grid-cols-4 gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-full aspect-square rounded-full ${color} hover:scale-110 transition-transform flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/20"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Warning Modal */}
            {warningMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#18181b] border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="text-red-500" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">İşlem Engellendi</h3>
                            <p className="text-zinc-400 text-sm mb-6">{warningMessage}</p>
                            <button
                                onClick={() => setWarningMessage(null)}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
