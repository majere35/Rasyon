import { useEffect, useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RecipesView } from './views/RecipesView';
import { TargetsView } from './views/TargetsView';
import { BalanceView } from './views/BalanceView';
import { LoginView } from './views/LoginView';
import { useStore } from './store/useStore';
import { WelcomeModal } from './components/WelcomeModal';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

function App() {
  const { initializeDefaults, theme, user, setUser } = useStore();
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize Defaults & Theme
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  // Data Sync Logic
  useEffect(() => {
    if (!user) return;

    // 1. Load Data on Login
    import('./lib/db').then(async ({ getUserData }) => {
      const data = await getUserData(user.uid);
      if (data) {
        useStore.setState(data);
      } else {
        console.log("No remote data found, keeping local defaults.");
      }
    });

    // 2. Save Data on Change (Debounced/Throttled by nature of user actions usually, but simple subscribe here)
    // Note: useStore.subscribe returns an unsubscribe function
    const unsubStore = useStore.subscribe(async (state) => {
      if (user) {
        const { saveUserData } = await import('./lib/db');
        saveUserData(user.uid, state);
      }
    });

    return () => unsubStore();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0f0f11] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

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
