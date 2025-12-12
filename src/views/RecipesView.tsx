import { useState } from 'react';
import { Plus, Search, ChefHat } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RecipeCard } from '../components/RecipeCard';
import { AddRecipeModal } from '../components/AddRecipeModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Recipe } from '../types';

export function RecipesView() {
    const { recipes, deleteRecipe } = useStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteRecipe(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Reçeteler</h2>
                    <p className="text-zinc-400">Menünüzdeki ürünlerin maliyetlerini yönetin.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Yeni Reçete
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                    type="text"
                    placeholder="Reçete ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRecipes.map((recipe) => (
                    <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredRecipes.length === 0 && (
                <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                    <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <ChefHat className="text-zinc-600" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">
                        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz reçete yok'}
                    </h3>
                    <p className="text-zinc-500">
                        {searchQuery ? 'Farklı bir arama terimi deneyin.' : 'Yeni bir reçete oluşturarak başlayın.'}
                    </p>
                </div>
            )}

            {/* Modal */}
            <AddRecipeModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingRecipe(null);
                }}
                editRecipe={editingRecipe || undefined}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={!!deleteId}
                title="Reçeteyi Sil"
                message="Bu reçeteyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                type="danger"
            />
        </div>
    );
}
