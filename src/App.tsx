import { DashboardLayout } from './layouts/DashboardLayout';
import { RecipesView } from './views/RecipesView';
import { TargetsView } from './views/TargetsView';

function App() {
  return (
    <DashboardLayout>
      {(activeTab) => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'recipes' && (
            <>
              <header className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Reçete Kartları</h2>
                <p className="text-zinc-400">Ürün maliyetlerini yönetin ve kârlılığınızı planlayın.</p>
              </header>
              <RecipesView />
            </>
          )}

          {activeTab === 'targets' && <TargetsView />}

          {activeTab === 'balance' && (
            <div className="p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4">Aylık Bilanço</h2>
              <p className="text-zinc-500">Bu modül yapım aşamasında.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
