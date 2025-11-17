import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';
import type { FilterState } from '../components/transactions/TransactionFilters';

export type TransactionType = 'income' | 'expense' | 'savings' | 'transfers';

export interface SavedFilter {
  id: string;
  name: string;
  type: TransactionType;
  filters: FilterState;
  createdAt: string;
  lastUsedAt: string;
}

type SavedFiltersState = {
  savedFilters: SavedFilter[];
  saveFilter: (name: string, type: TransactionType, filters: FilterState) => string;
  loadFilter: (id: string) => SavedFilter | undefined;
  deleteFilter: (id: string) => void;
  updateFilterLastUsed: (id: string) => void;
  getFiltersByType: (type: TransactionType) => SavedFilter[];
};

const storage = getLocalforageStorage('saved-filters');

export const useSavedFiltersStore = create<SavedFiltersState>()(
  devtools(
    persist(
      (set, get) => ({
        savedFilters: [],
        saveFilter: (name, type, filters) => {
          const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `filter_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          
          const now = new Date().toISOString();
          const newFilter: SavedFilter = {
            id,
            name,
            type,
            filters,
            createdAt: now,
            lastUsedAt: now,
          };

          set((state) => ({
            savedFilters: [...state.savedFilters, newFilter],
          }));

          return id;
        },
        loadFilter: (id) => {
          return get().savedFilters.find((f) => f.id === id);
        },
        deleteFilter: (id) => {
          set((state) => ({
            savedFilters: state.savedFilters.filter((f) => f.id !== id),
          }));
        },
        updateFilterLastUsed: (id) => {
          set((state) => ({
            savedFilters: state.savedFilters.map((f) =>
              f.id === id ? { ...f, lastUsedAt: new Date().toISOString() } : f
            ),
          }));
        },
        getFiltersByType: (type) => {
          return get().savedFilters
            .filter((f) => f.type === type)
            .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
        },
      }),
      {
        name: 'saved-filters',
        storage,
      }
    ),
    { name: 'SavedFiltersStore' }
  )
);

