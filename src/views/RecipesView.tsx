import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RecipeCard } from '../components/RecipeCard';
import { AddRecipeModal } from '../components/AddRecipeModal';
import { Recipe } from '../types';

export function RecipesView() {
    const { recipes, deleteRecipe } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);

    const handleEdit = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingRecipe(undefined);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Add New Button Card */}
                    <button
                        onClick={handleAddNew}
                        className="group h-full min-h-[200px] border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-indigo-500 hover:bg-zinc-800/30 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                            <Plus size={24} className="text-zinc-400 group-hover:text-indigo-400" />
                        </div>
                        <span className="font-medium text-zinc-400 group-hover:text-zinc-200">Yeni Reçete Ekle</span>
                    </button>

                    {recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onEdit={handleEdit}
                            onDelete={deleteRecipe}
                        />
                    ))}
                </div>
            </div>

            <AddRecipeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editRecipe={editingRecipe}
            />
        </>
    );
}
