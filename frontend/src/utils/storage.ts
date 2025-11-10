import localforage from 'localforage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const storageInstances: Record<string, StateStorage> = {};

export const getLocalforageStorage = (name: string): StateStorage => {
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
      await namespacedStore.setItem(key, value);
    },
    removeItem: async (key: string) => {
      await namespacedStore.removeItem(key);
    },
  }));

  storageInstances[name] = storage;

  return storage;
};

