import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export type EntityType =
  | 'Bank'
  | 'BankAccount'
  | 'IncomeTransaction'
  | 'ExpenseTransaction'
  | 'SavingsInvestmentTransaction'
  | 'ExpenseEMI'
  | 'SavingsInvestmentEMI'
  | 'RecurringIncome'
  | 'RecurringExpense'
  | 'RecurringSavingsInvestment';

export interface DeletedItem {
  id: string;
  type: EntityType;
  data: unknown; // The full entity data before deletion
  deletedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (deletedAt + 10 minutes)
}

type UndoState = {
  deletedItems: DeletedItem[];
  addDeletedItem: (type: EntityType, data: unknown) => string; // Returns the deleted item ID
  removeDeletedItem: (id: string) => void;
  getDeletedItem: (id: string) => DeletedItem | undefined;
  clearExpiredItems: () => void;
  restoreItem: (id: string) => DeletedItem | undefined; // Returns the item and removes it from store
};

const EXPIRY_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const storage = getLocalforageStorage('undo');

export const useUndoStore = create<UndoState>()(
  devtools(
    persist(
      (set, get) => ({
        deletedItems: [],

        addDeletedItem: (type, data) => {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + EXPIRY_DURATION_MS);

          const deletedItem: DeletedItem = {
            id: data.id,
            type,
            data,
            deletedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
          };

          set((state) => ({
            deletedItems: [...state.deletedItems, deletedItem],
          }));

          // Schedule cleanup for this item
          setTimeout(() => {
            get().clearExpiredItems();
          }, EXPIRY_DURATION_MS);

          return deletedItem.id;
        },

        removeDeletedItem: (id) => {
          set((state) => ({
            deletedItems: state.deletedItems.filter((item) => item.id !== id),
          }));
        },

        getDeletedItem: (id) => {
          return get().deletedItems.find((item) => item.id === id);
        },

        clearExpiredItems: () => {
          const now = new Date();
          set((state) => ({
            deletedItems: state.deletedItems.filter(
              (item) => new Date(item.expiresAt) > now
            ),
          }));
        },

        restoreItem: (id) => {
          const item = get().getDeletedItem(id);
          if (item) {
            get().removeDeletedItem(id);
            return item;
          }
          return undefined;
        },
      }),
      {
        name: 'undo',
        storage,
        version: 1,
      }
    )
  )
);

// Clean up expired items on store initialization
if (typeof window !== 'undefined') {
  useUndoStore.getState().clearExpiredItems();
}

