import { DashboardLayout } from './layouts/DashboardLayout';
import { RecipesView } from './views/RecipesView';
import { TargetsView } from './views/TargetsView';
import { BalanceView } from './views/BalanceView';

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

          {activeTab === 'balance' && <BalanceView />}
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
