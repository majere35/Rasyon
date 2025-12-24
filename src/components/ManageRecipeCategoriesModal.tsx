import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, AlertCircle, GripVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { IngredientCategory } from '../types';
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
            className={`group relative flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg ${isDragging ? 'opacity-50' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="w-6 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
            >
                <GripVertical size={14} />
            </div>

            <div className="relative">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditingColorId(editingColorId === cat.id ? null : cat.id);
                    }}
                    className={`w-4 h-4 rounded-full ${cat.color} hover:ring-2 ring-white/20 transition-all cursor-pointer shrink-0`}
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
                    <div className="fixed inset-0 z-40" onClick={() => setEditingColorId(null)} />
                )}
            </div>

            <span className="flex-1 text-sm text-white font-medium truncate">{cat.name}</span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={() => onEdit(cat)}
                    className="text-zinc-500 hover:text-indigo-400 transition-all p-1"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onDelete(cat.id)}
                    className="text-zinc-500 hover:text-red-400 transition-all p-1"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

interface ManageRecipeCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManageRecipeCategoriesModal({ isOpen, onClose }: ManageRecipeCategoriesModalProps) {
    const {
        recipeCategories,
        addRecipeCategory,
        updateRecipeCategory,
        deleteRecipeCategory,
        setRecipeCategories,
        recipes
    } = useStore();

    const COLORS = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
    ];

    const [isAddMode, setIsAddMode] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [editingColorId, setEditingColorId] = useState<string | null>(null);
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingCategoryId) {
            updateRecipeCategory(editingCategoryId, {
                name: name.trim(),
                color: selectedColor
            });
        } else {
            addRecipeCategory({
                id: crypto.randomUUID(),
                name: name.trim(),
                color: selectedColor
            });
        }

        setName('');
        setSelectedColor(COLORS[0]);
        setEditingCategoryId(null);
        setIsAddMode(false);
    };

    const handleEdit = (cat: IngredientCategory) => {
        setEditingCategoryId(cat.id);
        setName(cat.name);
        setSelectedColor(cat.color);
        setIsAddMode(true);
    };

    const handleDelete = (id: string) => {
        const hasRecipes = recipes.some(r => r.categoryId === id);
        if (hasRecipes) {
            setWarningMessage('Bu grup altında kayıtlı reçeteler bulunmaktadır. Grubu silerseniz bu ürünler "Kategorisiz" olacaktır. Devam etmek istiyor musunuz?');
            // Actually user logic might want to prevent deletion or allow it moving items to uncategorized.
            // For now let's allow it but warn.
        }
        deleteRecipeCategory(id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = recipeCategories.findIndex((cat) => cat.id === active.id);
            const newIndex = recipeCategories.findIndex((cat) => cat.id === over.id);
            setRecipeCategories(arrayMove(recipeCategories, oldIndex, newIndex));
        }
    };

    const handleColorUpdate = (categoryId: string, color: string) => {
        updateRecipeCategory(categoryId, { color });
        setEditingColorId(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1c1c1f] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        📂 Reçete Gruplarını Yönet
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    {/* Add/Edit Section */}
                    {isAddMode ? (
                        <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-indigo-500/20 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Grup Adı</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: Tavuk Burgerler"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Renk</label>
                                <div className="grid grid-cols-8 gap-2">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-full aspect-square rounded-md ${color} hover:scale-110 transition-transform ${selectedColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddMode(false);
                                        setEditingCategoryId(null);
                                        setName('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-sm"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
                                >
                                    {editingCategoryId ? 'Güncelle' : 'Ekle'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAddMode(true)}
                            className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            Yeni Grup Ekle
                        </button>
                    )}

                    {/* List Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Mevcut Gruplar</label>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={recipeCategories.map(cat => cat.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {recipeCategories.map(cat => (
                                        <SortableItem
                                            key={cat.id}
                                            id={cat.id}
                                            cat={cat}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            editingColorId={editingColorId}
                                            setEditingColorId={setEditingColorId}
                                            COLORS={COLORS}
                                            handleColorUpdate={handleColorUpdate}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {recipeCategories.length === 0 && !isAddMode && (
                            <div className="text-center py-8 text-zinc-600 italic text-sm">
                                Henüz bir grup tanımlanmamış.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>

            {/* Warning Message (Toast-like Alert) */}
            {warningMessage && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-orange-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{warningMessage}</p>
                    <button onClick={() => setWarningMessage(null)} className="ml-2 hover:bg-white/20 p-1 rounded">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
