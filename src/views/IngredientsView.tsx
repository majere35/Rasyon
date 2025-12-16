import { useState } from 'react';
import { Plus, Search, Trash2, Tag, Edit2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NumberInput } from '../components/NumberInput';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatCurrency } from '../lib/utils';
import type { RawIngredient } from '../types';

export function IngredientsView() {
    const {
        rawIngredients,
        ingredientCategories,
        addRawIngredient,
        updateRawIngredient,
        deleteRawIngredient,
        bulkDeleteRawIngredients,
        addIngredientCategory,
        deleteIngredientCategory
    } = useStore();

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
        minimumStock: 0
    });

    // Delete Modal
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'ingredient' | 'category' | 'bulk_ingredients' | null>(null);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Add Category Modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Warning Modal
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    // Filtered Ingredients
    const filteredIngredients = rawIngredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    // CRUD Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !selectedCategory) return;

        if (editingId) {
            updateRawIngredient(editingId, {
                id: editingId,
                categoryId: selectedCategory,
                name: formData.name,
                price: Number(formData.price),
                unit: formData.unit as any,
                minimumStock: Number(formData.minimumStock)
            });
            setEditingId(null);
        } else {
            addRawIngredient({
                id: crypto.randomUUID(),
                categoryId: selectedCategory,
                name: formData.name!,
                price: Number(formData.price),
                unit: formData.unit as any || 'kg',
                minimumStock: Number(formData.minimumStock)
            });
        }

        // Reset Form but keep category
        setFormData({ name: '', price: 0, unit: 'kg', minimumStock: 0 });
        setIsAddMode(false);
    };

    const handleEdit = (ingredient: RawIngredient) => {
        setFormData({
            name: ingredient.name,
            price: ingredient.price,
            unit: ingredient.unit,
            minimumStock: ingredient.minimumStock
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
        setNewCategoryName('');
        setIsCategoryModalOpen(true);
    };

    const submitAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            addIngredientCategory({
                id: crypto.randomUUID(),
                name: newCategoryName.trim(),
                color: 'bg-zinc-500'
            });
            setIsCategoryModalOpen(false);
            setNewCategoryName('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Hammadde Yönetimi</h2>
                <p className="text-zinc-400">Reçetelerinizde kullanacağınız ürünleri ve fiyatlarını buradan yönetin.</p>
            </div>

            <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex-1 shadow-xl">

                {/* LEFT: Categories Sidebar */}
                <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <span className="font-semibold text-zinc-300 text-sm">Kategoriler</span>
                        <button onClick={handleAddCategoryClick} className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedCategory === null
                                ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <Tag size={14} /> Tüm Kategoriler
                        </button>

                        {ingredientCategories.map(cat => (
                            <div key={cat.id} className="group relative">
                                <button
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                        ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                                    {cat.name}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Main Content */}
                <div className="flex-1 flex flex-col bg-[#18181b]">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center gap-4 bg-[#18181b]">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Hammadde ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        {selectedCategory && (
                            <button
                                onClick={() => {
                                    setIsAddMode(true);
                                    setEditingId(null);
                                    setFormData({ name: '', price: 0, unit: 'kg', minimumStock: 0 });
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={16} /> Yeni Hammadde
                            </button>
                        )}

                        {/* Bulk Delete Button */}
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => {
                                    setDeleteId('bulk'); // Dummy
                                    setDeleteType('bulk_ingredients');
                                }}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors animate-in fade-in"
                            >
                                <Trash2 size={16} /> Seçilenleri Sil ({selectedIds.size})
                            </button>
                        )}
                    </div>

                    {/* Add/Edit Form Panel */}
                    {(isAddMode && selectedCategory) && (
                        <div className="border-b border-indigo-500/30 bg-indigo-500/5 p-4 animate-in slide-in-from-top-2">
                            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
                                <div className="space-y-1 flex-1 min-w-[200px]">
                                    <label className="text-xs font-semibold text-indigo-300 ml-1">Ürün Adı</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                        placeholder="Örn: Un"
                                    />
                                </div>
                                <div className="space-y-1 w-32">
                                    <label className="text-xs font-semibold text-indigo-300 ml-1">Birim Fiyat</label>
                                    <NumberInput
                                        value={formData.price || 0}
                                        onChange={val => setFormData({ ...formData, price: val })}
                                        className="w-full bg-zinc-900"
                                        step={0.0001}
                                    />
                                </div>
                                <div className="space-y-1 w-24">
                                    <label className="text-xs font-semibold text-indigo-300 ml-1">Birim</label>
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-white focus:border-indigo-500 outline-none text-sm h-[38px]"
                                    >
                                        <option value="kg">Kg</option>
                                        <option value="lt">Lt</option>
                                        <option value="adet">Adet</option>
                                        <option value="gr">Gr</option>
                                        <option value="cl">Cl</option>
                                    </select>
                                </div>

                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-medium h-[38px]">
                                    {editingId ? 'Güncelle' : 'Ekle'}
                                </button>
                                <button type="button" onClick={() => setIsAddMode(false)} className="text-zinc-400 hover:text-white px-3 py-2 h-[38px]">
                                    İptal
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Table */}
                    <div className="flex-1 overflow-auto bg-[#18181b]">
                        {filteredIngredients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                                <AlertCircle size={32} className="mb-2 opacity-50" />
                                <p>{selectedCategory ? 'Bu kategoride hammadde yok.' : 'Kategori seçerek başlayın.'}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
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
                        <h3 className="text-lg font-bold text-white mb-4">Yeni Kategori Ekle</h3>
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
