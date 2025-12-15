import { useEffect, useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RecipesView } from './views/RecipesView';
import { IngredientsView } from './views/IngredientsView';
import { TargetsView } from './views/TargetsView';
import { BalanceView } from './views/BalanceView';
import { LoginView } from './views/LoginView';
import { AdminView } from './views/AdminView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminReportsView, AdminSettingsView } from './views/AdminPlaceholderViews';
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
    import('./lib/db').then(async ({ getUserData, updateUserMetadata }) => {
      const remoteData = await getUserData(user.uid);
      const localState = useStore.getState();

      const hasRemoteData = remoteData && (
        (remoteData.recipes && remoteData.recipes.length > 0) ||
        (remoteData.expenses && remoteData.expenses.length > 0)
      );

      // Check if local state has meaningful data (not just defaults, but we assume if they exist they are meaningful for now)
      const hasLocalData = localState.recipes.length > 0 || localState.expenses.length > 0;

      if (hasRemoteData) {
        console.log("Remote data found, syncing to local...");
        useStore.setState(remoteData);
      } else if (hasLocalData) {
        console.log("No meaningful remote data, syncing local data to cloud...");
        const { saveUserData } = await import('./lib/db');
        saveUserData(user.uid, localState);
      }

      // Update metadata after sync decision
      updateUserMetadata(user);
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
            {activeTab === 'ingredients' && <IngredientsView />}
            {activeTab === 'targets' && <TargetsView />}
            {activeTab === 'balance' && <BalanceView />}

            {activeTab === 'admin_dashboard' && <AdminView />}
            {activeTab === 'admin_users' && <AdminUsersView />}
            {activeTab === 'admin_reports' && <AdminReportsView />}
            {activeTab === 'admin_settings' && <AdminSettingsView />}
          </>
        )}
      </DashboardLayout>
    </>
  );
}

export default App;
