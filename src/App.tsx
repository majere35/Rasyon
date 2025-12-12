import { useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RecipesView } from './views/RecipesView';
import { TargetsView } from './views/TargetsView';
import { BalanceView } from './views/BalanceView';
import { useStore } from './store/useStore';
import { WelcomeModal } from './components/WelcomeModal';

function App() {
  const { initializeDefaults, theme } = useStore();

  useEffect(() => {
    initializeDefaults();
  }, [initializeDefaults]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <WelcomeModal />
      <DashboardLayout>
        {(activeTab) => (
          <>
            {activeTab === 'recipes' && <RecipesView />}
            {activeTab === 'targets' && <TargetsView />}
            {activeTab === 'balance' && <BalanceView />}
          </>
        )}
      </DashboardLayout>
    </>
  );
}

export default App;
