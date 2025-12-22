import { useEffect, useState, useRef, useCallback } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RecipesView } from './views/RecipesView';
import { IngredientsView } from './views/IngredientsView';
import { TargetsView } from './views/TargetsView';
import { BalanceView } from './views/BalanceView';
import { MonthlyAccountingView } from './views/MonthlyAccountingView';
import { LoginView } from './views/LoginView';
import { AdminView } from './views/AdminView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminReportsView, AdminSettingsView } from './views/AdminPlaceholderViews';
import { useStore } from './store/useStore';
import { WelcomeModal } from './components/WelcomeModal';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { SyncStatusIndicator, useSyncStatus } from './components/SyncStatusIndicator';

// Debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };

  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  return debouncedFn;
}

function App() {
  const { initializeDefaults, theme, user, setUser } = useStore();
  const [authLoading, setAuthLoading] = useState(true);
  const { status: syncStatus, startSync, syncSuccess, syncError, lastSyncTime } = useSyncStatus();
  const isInitialSyncDone = useRef(false);

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
      // Reset initial sync flag on logout
      if (!currentUser) {
        isInitialSyncDone.current = false;
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  // Manual sync function
  const handleManualSync = useCallback(async () => {
    if (!user || syncStatus === 'syncing') return;

    startSync();
    try {
      const { saveUserData } = await import('./lib/db');
      const state = useStore.getState();
      await saveUserData(user.uid, state);
      syncSuccess();
      console.log("[Sync] Manual sync completed successfully");
    } catch (error) {
      console.error("[Sync] Manual sync failed:", error);
      syncError();
    }
  }, [user, syncStatus, startSync, syncSuccess, syncError]);

  // Data Sync Logic
  useEffect(() => {
    if (!user) return;

    // 1. Load Data on Login (only once)
    if (!isInitialSyncDone.current) {
      isInitialSyncDone.current = true;
      startSync();

      import('./lib/db').then(async ({ getUserData, updateUserMetadata, saveUserData }) => {
        try {
          console.log("[Sync] Starting initial sync for:", user.uid);
          const remoteData = await getUserData(user.uid);
          const localState = useStore.getState();

          const hasRemoteData = remoteData && (
            (remoteData.recipes && remoteData.recipes.length > 0) ||
            (remoteData.expenses && remoteData.expenses.length > 0) ||
            (remoteData.rawIngredients && remoteData.rawIngredients.length > 0) ||
            (remoteData.company)
          );

          // Check if local state has meaningful data
          const hasLocalData = localState.recipes.length > 0 ||
            localState.expenses.length > 0 ||
            localState.rawIngredients.length > 0;

          console.log(`[Sync] Status - Remote Data: ${!!hasRemoteData}, Local Data: ${hasLocalData}`);

          if (hasRemoteData) {
            console.log("[Sync] Priority: REMOTE. Overwriting local state with cloud data.");
            useStore.setState(remoteData);
          } else if (hasLocalData) {
            console.log("[Sync] Priority: LOCAL. No cloud data found, uploading local data.");
            await saveUserData(user.uid, localState);
          } else {
            console.log("[Sync] No meaningful data on both ends. Starting fresh.");
          }

          // Update metadata after sync decision
          await updateUserMetadata(user);
          syncSuccess();
        } catch (error) {
          console.error("[Sync] Initial sync failed:", error);
          syncError();
        }
      });
    }

    // 2. Save Data on Change with DEBOUNCE (1 second delay)
    const debouncedSave = debounce(async (state: any) => {
      if (!user) return;

      startSync();
      try {
        const { saveUserData } = await import('./lib/db');
        await saveUserData(user.uid, state);
        syncSuccess();
        console.log("[Sync] Auto-save completed");
      } catch (error) {
        console.error("[Sync] Auto-save failed:", error);
        syncError();
      }
    }, 1500); // 1.5 second debounce

    const unsubStore = useStore.subscribe((state) => {
      // Skip if initial sync hasn't completed
      if (!isInitialSyncDone.current) return;

      console.log("[Sync] Store updated, scheduling save...");
      debouncedSave(state);
    });

    return () => {
      unsubStore();
      debouncedSave.cancel();
    };
  }, [user, startSync, syncSuccess, syncError]);

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
      <DashboardLayout
        syncIndicator={
          <SyncStatusIndicator
            status={syncStatus}
            onManualSync={handleManualSync}
            lastSyncTime={lastSyncTime}
          />
        }
      >
        {(activeTab) => (
          <>
            {activeTab === 'recipes' && <RecipesView />}
            {activeTab === 'ingredients' && <IngredientsView />}
            {activeTab === 'targets' && <TargetsView />}
            {activeTab === 'balance' && <BalanceView />}
            {activeTab === 'monthly_accounting' && <MonthlyAccountingView />}

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
