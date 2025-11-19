import localforage from 'localforage';
import { createJSONStorage } from 'zustand/middleware';
import { useSaveStatusStore } from '../store/useSaveStatusStore';

const storageInstances: Record<string, ReturnType<typeof createJSONStorage>> = {};
const saveStatusTimers: Record<string, NodeJS.Timeout | null> = {};

// Debounce save status updates (500ms)
const DEBOUNCE_MS = 500;

const debouncedSetSaving = (storeName: string) => {
  const timerKey = `${storeName}_saving`;
  
  // Clear existing timer
  if (saveStatusTimers[timerKey]) {
    clearTimeout(saveStatusTimers[timerKey]!);
  }
  
  // Debounce showing "Saving..." - only show after 500ms of no changes
  // This prevents flashing "Saving..." on every keystroke
  saveStatusTimers[timerKey] = setTimeout(() => {
    useSaveStatusStore.getState().setSaving();
    saveStatusTimers[timerKey] = null;
  }, DEBOUNCE_MS);
};

const debouncedSetSaved = (storeName: string) => {
  const timerKey = `${storeName}_saved`;
  const savingTimerKey = `${storeName}_saving`;
  
  // Clear any pending "saving" timer
  if (saveStatusTimers[savingTimerKey]) {
    clearTimeout(saveStatusTimers[savingTimerKey]!);
    saveStatusTimers[savingTimerKey] = null;
  }
  
  // Clear existing "saved" timer
  if (saveStatusTimers[timerKey]) {
    clearTimeout(saveStatusTimers[timerKey]!);
  }
  
  // Show "saved" immediately after save completes
  // But debounce if there are rapid successive saves
  saveStatusTimers[timerKey] = setTimeout(() => {
    useSaveStatusStore.getState().setSaved();
    saveStatusTimers[timerKey] = null;
  }, 100); // Small delay to batch rapid saves
};

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
      // Track save status with debouncing
      try {
        debouncedSetSaving(name);
        await namespacedStore.setItem(key, value);
        debouncedSetSaved(name);
      } catch (error) {
        // Clear any pending timers on error
        const timerKey = `${name}_saved`;
        if (saveStatusTimers[timerKey]) {
          clearTimeout(saveStatusTimers[timerKey]!);
          saveStatusTimers[timerKey] = null;
        }
        useSaveStatusStore.getState().setError();
        throw error;
      }
    },
    removeItem: async (key: string) => {
      try {
        debouncedSetSaving(name);
        await namespacedStore.removeItem(key);
        debouncedSetSaved(name);
      } catch (error) {
        // Clear any pending timers on error
        const timerKey = `${name}_saved`;
        if (saveStatusTimers[timerKey]) {
          clearTimeout(saveStatusTimers[timerKey]!);
          saveStatusTimers[timerKey] = null;
        }
        useSaveStatusStore.getState().setError();
        throw error;
      }
    },
  }));

  storageInstances[name] = storage;

  return storage;
};

