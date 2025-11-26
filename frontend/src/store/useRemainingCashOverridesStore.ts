import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

/**
 * Store for manual remaining cash overrides
 * Used when auto-calculation from transactions isn't possible
 */
type RemainingCashOverridesState = {
  overrides: Record<string, Record<string, number | null>>; // monthId -> accountId -> remainingCash
  setOverride: (monthId: string, accountId: string, remainingCash: number | null) => void;
  getOverride: (monthId: string, accountId: string) => number | null | undefined;
  clearOverride: (monthId: string, accountId: string) => void;
  clearAllOverrides: () => void;
  clearOverridesForMonth: (monthId: string) => void;
};

const storage = getLocalforageStorage('remaining-cash-overrides');

export const useRemainingCashOverridesStore = create<RemainingCashOverridesState>()(
  devtools(
    persist(
      (set, get) => ({
        overrides: {},

        setOverride: (monthId, accountId, remainingCash) => {
          set((state) => {
            const monthOverrides = state.overrides[monthId] || {};
            return {
              overrides: {
                ...state.overrides,
                [monthId]: {
                  ...monthOverrides,
                  [accountId]: remainingCash,
                },
              },
            };
          });
        },

        getOverride: (monthId, accountId) => {
          return get().overrides[monthId]?.[accountId];
        },

        clearOverride: (monthId, accountId) => {
          set((state) => {
            const monthOverrides = state.overrides[monthId];
            if (!monthOverrides) return state;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [accountId]: _, ...rest } = monthOverrides;
            if (Object.keys(rest).length === 0) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [monthId]: __, ...restMonths } = state.overrides;
              return { overrides: restMonths };
            }

            return {
              overrides: {
                ...state.overrides,
                [monthId]: rest,
              },
            };
          });
        },

        clearAllOverrides: () => {
          set({ overrides: {} });
        },

        clearOverridesForMonth: (monthId) => {
          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [monthId]: _, ...rest } = state.overrides;
            return { overrides: rest };
          });
        },
      }),
      {
        name: 'remaining-cash-overrides',
        storage,
        version: 1,
      }
    )
  )
);

