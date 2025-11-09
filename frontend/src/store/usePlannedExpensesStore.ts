import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_ACCOUNTS, DEFAULT_BUCKETS } from '../constants/plannedExpenses'
import { samplePlannedMonths } from '../data/samplePlannedMonths'
import {
  AllocationStatus,
  PlannedBucketKey,
  PlannedExpensesActions,
  PlannedExpensesState,
  PlannedExpensesStore,
} from '../types/plannedExpenses'

const STORAGE_KEY = 'planned-expenses-store-v1'

const sortMonths = (months: PlannedExpensesState['months']) =>
  [...months].sort((a, b) => a.monthStart.localeCompare(b.monthStart))

const createInitialState = (): PlannedExpensesState => ({
  accounts: DEFAULT_ACCOUNTS,
  buckets: DEFAULT_BUCKETS,
  months: [],
  selectedMonthId: undefined,
})

export const usePlannedExpensesStore = create<PlannedExpensesStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      seedSampleData: () => {
        set({
          accounts: DEFAULT_ACCOUNTS,
          buckets: DEFAULT_BUCKETS,
          months: sortMonths(samplePlannedMonths),
          selectedMonthId: samplePlannedMonths[0]?.id,
        })
      },
      selectMonth: (monthId) => {
        if (get().months.some((m) => m.id === monthId)) {
          set({ selectedMonthId: monthId })
        }
      },
      addMonth: (month) => {
        set((state) => ({
          months: sortMonths([...state.months, month]),
          selectedMonthId: month.id,
        }))
      },
      updateMonth: (monthId, updater) => {
        set((state) => ({
          months: sortMonths(
            state.months.map((month) => (month.id === monthId ? updater({ ...month }) : month))
          ),
        }))
      },
      updateBucketStatus: (monthId, bucketKey, status) => {
        set((state) => ({
          months: sortMonths(
            state.months.map((month) => {
              if (month.id !== monthId) return month
              const nextStatuses = month.bucketStatuses.map((bucket) =>
                bucket.key === bucketKey ? { ...bucket, status } : bucket
              )
              const exists = nextStatuses.some((bucket) => bucket.key === bucketKey)
              return {
                ...month,
                bucketStatuses: exists
                  ? nextStatuses
                  : [...nextStatuses, { key: bucketKey, status }],
              }
            })
          ),
        }))
      },
      updateAllocation: (monthId, allocationId, updater) => {
        set((state) => ({
          months: sortMonths(
            state.months.map((month) => {
              if (month.id !== monthId) return month
              return {
                ...month,
                allocations: month.allocations.map((allocation) =>
                  allocation.id === allocationId ? updater({ ...allocation }) : allocation
                ),
              }
            })
          ),
        }))
      },
      replaceAccounts: (accounts) => set({ accounts }),
      replaceBuckets: (buckets) => set({ buckets }),
      reset: () => set(createInitialState()),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        buckets: state.buckets,
        months: state.months,
        selectedMonthId: state.selectedMonthId,
      }),
      migrate: (persistedState, version) => {
        if (!persistedState || version < 1) {
          return {
            ...createInitialState(),
            ...(persistedState as Partial<PlannedExpensesState>),
          }
        }
        return persistedState as PlannedExpensesState
      },
    }
  )
)

export const selectPlannedMonths = (state: PlannedExpensesStore) => state.months
export const selectSelectedMonth = (state: PlannedExpensesStore) =>
  state.months.find((month) => month.id === state.selectedMonthId)
export const selectBucketStatus = (bucketKey: PlannedBucketKey) =>
  (state: PlannedExpensesStore): AllocationStatus => {
    const month = state.months.find((m) => m.id === state.selectedMonthId)
    return (
      month?.bucketStatuses.find((bucket) => bucket.key === bucketKey)?.status ?? 'pending'
    )
  }
