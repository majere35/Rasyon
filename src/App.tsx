import { DashboardLayout } from './layouts/DashboardLayout';

function App() {
  return (
    <DashboardLayout>
      {(activeTab) => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {activeTab === 'recipes' && 'Reçete Kartları'}
              {activeTab === 'targets' && 'Satış Hedefleri'}
              {activeTab === 'balance' && 'Aylık Bilanço'}
            </h2>
            <p className="text-zinc-400 mt-2">
              {activeTab === 'recipes' && 'Ürün maliyetlerini ve reçetelerini yönetin.'}
              {activeTab === 'targets' && 'Kârlılık hedeflerini simüle edin.'}
              {activeTab === 'balance' && 'Genel finansal durumunuzu inceleyin.'}
            </p>
          </header>

          <div className="p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
            <p className="text-zinc-500">Bu modül henüz yapım aşamasında: {activeTab}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default App;
