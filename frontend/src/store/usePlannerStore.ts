import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { AllocationStatus } from '../types/plannedExpenses';
import { getLocalforageStorage } from '../utils/storage';

type PlannerView = 'dashboard' | 'planner' | 'settings';

type PlannerState = {
  activeMonthId: string | null;
  view: PlannerView;
  bucketFilter: AllocationStatus | 'all';
  searchTerm: string;
  setActiveMonth: (monthId: string | null) => void;
  setView: (view: PlannerView) => void;
  setBucketFilter: (status: AllocationStatus | 'all') => void;
  setSearchTerm: (term: string) => void;
  resetFilters: () => void;
};

const storage = getLocalforageStorage('planner-preferences');

export const usePlannerStore = create<PlannerState>()(
  devtools(
    persist(
      (set) => ({
        activeMonthId: null,
        view: 'dashboard',
        bucketFilter: 'all',
        searchTerm: '',
        setActiveMonth: (monthId) => set({ activeMonthId: monthId }),
        setView: (view) => set({ view }),
        setBucketFilter: (status) => set({ bucketFilter: status }),
        setSearchTerm: (term) => set({ searchTerm: term }),
        resetFilters: () => set({ bucketFilter: 'all', searchTerm: '' }),
      }),
      {
        name: 'planner-preferences',
        storage,
      },
    ),
  ),
);

