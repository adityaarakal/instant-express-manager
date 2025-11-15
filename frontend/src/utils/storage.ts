import localforage from 'localforage';
import { createJSONStorage } from 'zustand/middleware';
import { useSaveStatusStore } from '../store/useSaveStatusStore';

const storageInstances: Record<string, ReturnType<typeof createJSONStorage>> = {};

export const getLocalforageStorage = (name: string) => {
  if (storageInstances[name]) {
    return storageInstances[name];
  }

  const namespacedStore = localforage.createInstance({
    name: 'instant-express-manager',
    storeName: name,
  });

  const storage = createJSONStorage(() => ({
    getItem: async (key: string) => {
      const value = await namespacedStore.getItem<string>(key);
      return value ?? null;
    },
    setItem: async (key: string, value: string) => {
      // Track save status
      try {
        useSaveStatusStore.getState().setSaving();
        await namespacedStore.setItem(key, value);
        useSaveStatusStore.getState().setSaved();
      } catch (error) {
        useSaveStatusStore.getState().setError();
        throw error;
      }
    },
    removeItem: async (key: string) => {
      try {
        useSaveStatusStore.getState().setSaving();
        await namespacedStore.removeItem(key);
        useSaveStatusStore.getState().setSaved();
      } catch (error) {
        useSaveStatusStore.getState().setError();
        throw error;
      }
    },
  }));

  storageInstances[name] = storage;

  return storage;
};

