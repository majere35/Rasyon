import { useState } from 'react';
import { Plus, Search, ChefHat, Beaker, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RecipeCard } from '../components/RecipeCard';
import { AddRecipeModal } from '../components/AddRecipeModal';
import { IntermediateProductCard } from '../components/IntermediateProductCard';
import { AddIntermediateProductModal } from '../components/AddIntermediateProductModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Recipe, IntermediateProduct } from '../types';

type TabType = 'recipes' | 'intermediate';

export function RecipesView() {
    const { recipes, deleteRecipe, intermediateProducts, deleteIntermediateProduct, recipeCategories } = useStore();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('recipes');

    // Recipe modal states
    const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    // Intermediate product modal states
    const [isAddIntermediateModalOpen, setIsAddIntermediateModalOpen] = useState(false);
    const [editingIntermediateProduct, setEditingIntermediateProduct] = useState<IntermediateProduct | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Category expanded states
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
        // By default, if there are only a few categories, expand all
        return {}; // Start with everything collapsed as requested "tüm kategorilerin olduğu ekran görünsün"
    });

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Group recipes by category
    const categorizedRecipes = recipeCategories.map(cat => ({
        ...cat,
        recipes: recipes.filter(r => r.categoryId === cat.id && r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    })).filter(cat => cat.recipes.length > 0 || !searchQuery); // Show categories even if empty only if not searching? 
    // Actually user says "Tavuk Burgerler. buna tıklandığında drop down menü olarak şu anki görünüm kartları açılsın"

    const uncategorizedRecipes = recipes.filter(r => !r.categoryId && r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'recipe' | 'intermediate'>('recipe');

    const filteredIntermediateProducts = intermediateProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEditRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setIsAddRecipeModalOpen(true);
    };

    const handleEditIntermediateProduct = (product: IntermediateProduct) => {
        setEditingIntermediateProduct(product);
        setIsAddIntermediateModalOpen(true);
    };

    const handleDeleteRecipeClick = (id: string) => {
        setDeleteType('recipe');
        setDeleteId(id);
    };

    const handleDeleteIntermediateClick = (id: string) => {
        setDeleteType('intermediate');
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            if (deleteType === 'recipe') {
                deleteRecipe(deleteId);
            } else {
                deleteIntermediateProduct(deleteId);
            }
            setDeleteId(null);
        }
    };

    const handleAddNew = () => {
        if (activeTab === 'recipes') {
            setIsAddRecipeModalOpen(true);
        } else {
            setIsAddIntermediateModalOpen(true);
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
                    onClick={handleAddNew}
                    className={`inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95 ${activeTab === 'recipes'
                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                        : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
                        }`}
                >
                    <Plus size={20} />
                    {activeTab === 'recipes' ? 'Yeni Reçete' : 'Yeni Ara Ürün'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 w-fit">
                <button
                    onClick={() => setActiveTab('recipes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recipes'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <ChefHat size={16} />
                    Son Ürünler
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'recipes' ? 'bg-indigo-500' : 'bg-zinc-700'
                        }`}>
                        {recipes.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('intermediate')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'intermediate'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <Beaker size={16} />
                    Ara Ürünler
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'intermediate' ? 'bg-orange-500' : 'bg-zinc-700'
                        }`}>
                        {intermediateProducts.length}
                    </span>
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                    type="text"
                    placeholder={activeTab === 'recipes' ? 'Reçete ara...' : 'Ara ürün ara...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${activeTab === 'recipes'
                        ? 'focus:border-indigo-500 focus:ring-indigo-500'
                        : 'focus:border-orange-500 focus:ring-orange-500'
                        }`}
                />
            </div>

            {/* Grid - Recipes (Categorized) */}
            {activeTab === 'recipes' && (
                <div className="space-y-4">
                    {categorizedRecipes.map((category) => (
                        <div key={category.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden transition-all">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-6 rounded-full ${category.color || 'bg-indigo-500'}`}></div>
                                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">
                                        {category.recipes.length} Ürün
                                    </span>
                                </div>
                                {expandedCategories[category.id] ? <ChevronDown className="text-zinc-500" /> : <ChevronRight className="text-zinc-500" />}
                            </button>

                            {/* Category Content (Grid) */}
                            {expandedCategories[category.id] && (
                                <div className="p-4 pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {category.recipes.map((recipe) => (
                                            <RecipeCard
                                                key={recipe.id}
                                                recipe={recipe}
                                                onEdit={handleEditRecipe}
                                                onDelete={handleDeleteRecipeClick}
                                            />
                                        ))}
                                    </div>
                                    {category.recipes.length === 0 && (
                                        <div className="text-center py-8 text-zinc-600 text-sm italic">
                                            Bu kategoride henüz ürün yok.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Uncategorized Section */}
                    {uncategorizedRecipes.length > 0 && (
                        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => toggleCategory('uncategorized')}
                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-6 rounded-full bg-zinc-600"></div>
                                    <h3 className="text-lg font-semibold text-white">Kategorisiz</h3>
                                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">
                                        {uncategorizedRecipes.length} Ürün
                                    </span>
                                </div>
                                {expandedCategories['uncategorized'] ? <ChevronDown className="text-zinc-500" /> : <ChevronRight className="text-zinc-500" />}
                            </button>

                            {expandedCategories['uncategorized'] && (
                                <div className="p-4 pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {uncategorizedRecipes.map((recipe) => (
                                            <RecipeCard
                                                key={recipe.id}
                                                recipe={recipe}
                                                onEdit={handleEditRecipe}
                                                onDelete={handleDeleteRecipeClick}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State - Recipes */}
                    {recipes.length === 0 && (
                        <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                            <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <ChefHat className="text-zinc-600" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">Henüz reçete yok</h3>
                            <p className="text-zinc-500">Yeni bir reçete oluşturarak başlayın.</p>
                        </div>
                    )}

                    {recipes.length > 0 && searchQuery && categorizedRecipes.reduce((sum, c) => sum + c.recipes.length, 0) + uncategorizedRecipes.length === 0 && (
                        <div className="text-center py-20">
                            <h3 className="text-zinc-400 italic">Aramanızla eşleşen ürün bulunamadı.</h3>
                        </div>
                    )}
                </div>
            )}

            {/* Grid - Intermediate Products */}
            {activeTab === 'intermediate' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredIntermediateProducts.map((product) => (
                            <IntermediateProductCard
                                key={product.id}
                                product={product}
                                onEdit={handleEditIntermediateProduct}
                                onDelete={handleDeleteIntermediateClick}
                            />
                        ))}
                    </div>

                    {/* Empty State - Intermediate Products */}
                    {filteredIntermediateProducts.length === 0 && (
                        <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                            <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Beaker className="text-zinc-600" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">
                                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz ara ürün yok'}
                            </h3>
                            <p className="text-zinc-500 max-w-sm mx-auto">
                                {searchQuery
                                    ? 'Farklı bir arama terimi deneyin.'
                                    : 'Soslar, karışımlar gibi ara ürünler oluşturun ve son ürün reçetelerinde kullanın.'}
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Recipe Modal */}
            <AddRecipeModal
                isOpen={isAddRecipeModalOpen}
                onClose={() => {
                    setIsAddRecipeModalOpen(false);
                    setEditingRecipe(null);
                }}
                editRecipe={editingRecipe || undefined}
            />

            {/* Intermediate Product Modal */}
            <AddIntermediateProductModal
                isOpen={isAddIntermediateModalOpen}
                onClose={() => {
                    setIsAddIntermediateModalOpen(false);
                    setEditingIntermediateProduct(null);
                }}
                editProduct={editingIntermediateProduct || undefined}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={!!deleteId}
                title={deleteType === 'recipe' ? 'Reçeteyi Sil' : 'Ara Ürünü Sil'}
                message={deleteType === 'recipe'
                    ? 'Bu reçeteyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
                    : 'Bu ara ürünü silmek istediğinize emin misiniz? Bu ara ürünü kullanan reçetelerde sorun oluşabilir.'}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
                type="danger"
            />
        </div>
    );
}

