import { create } from 'zustand';

type PlannerState = {
  activeMonthId: string | null;
  setActiveMonth: (monthId: string | null) => void;
};

export const usePlannerStore = create<PlannerState>((set) => ({
  activeMonthId: null,
  setActiveMonth: (monthId) => set({ activeMonthId: monthId }),
}));

