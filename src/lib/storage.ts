import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

// Custom storage adapter for Zustand using idb-keyval (IndexedDB)
export const storage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        // console.log('[Storage] Getting item:', name);
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        // console.log('[Storage] Setting item:', name);
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        // console.log('[Storage] Removing item:', name);
        await del(name);
    },
};
