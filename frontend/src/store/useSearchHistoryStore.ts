import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export type TransactionType = 'income' | 'expense' | 'savings' | 'transfers';

export interface SearchHistoryEntry {
  id: string;
  type: TransactionType;
  searchTerm: string;
  searchedAt: string;
}

const MAX_HISTORY_ENTRIES = 20; // Keep last 20 searches

type SearchHistoryState = {
  history: SearchHistoryEntry[];
  addSearch: (type: TransactionType, searchTerm: string) => void;
  getHistoryByType: (type: TransactionType) => SearchHistoryEntry[];
  clearHistory: (type?: TransactionType) => void;
};

const storage = getLocalforageStorage('search-history');

export const useSearchHistoryStore = create<SearchHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        history: [],
        addSearch: (type, searchTerm) => {
          // Don't save empty searches
          if (!searchTerm.trim()) return;

          // Remove duplicates (same type and search term)
          const filtered = get().history.filter(
            (entry) => !(entry.type === type && entry.searchTerm.toLowerCase() === searchTerm.toLowerCase().trim())
          );

          const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `search_${Date.now()}_${Math.random().toString(36).slice(2)}`;

          const newEntry: SearchHistoryEntry = {
            id,
            type,
            searchTerm: searchTerm.trim(),
            searchedAt: new Date().toISOString(),
          };

          // Add new entry at the beginning, limit to MAX_HISTORY_ENTRIES
          const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ENTRIES);

          set({ history: updated });
        },
        getHistoryByType: (type) => {
          return get().history
            .filter((entry) => entry.type === type)
            .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())
            .slice(0, 10); // Return max 10 most recent for dropdown
        },
        clearHistory: (type) => {
          if (type) {
            // Clear history for specific type
            set((state) => ({
              history: state.history.filter((entry) => entry.type !== type),
            }));
          } else {
            // Clear all history
            set({ history: [] });
          }
        },
      }),
      {
        name: 'search-history',
        storage,
      }
    ),
    { name: 'SearchHistoryStore' }
  )
);

