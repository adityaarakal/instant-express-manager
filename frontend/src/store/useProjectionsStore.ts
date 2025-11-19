import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

/**
 * Projection data for a specific month
 */
export interface MonthProjection {
  monthId: string; // Format: "YYYY-MM"
  inflowTotal: number | null; // Projected inflow total
  savingsTarget: number | null; // Target savings amount
  lastUpdated: string; // ISO timestamp
}

type ProjectionsState = {
  projections: MonthProjection[];
  setProjection: (monthId: string, inflowTotal: number | null, savingsTarget: number | null) => void;
  getProjection: (monthId: string) => MonthProjection | undefined;
  getInflowTotal: (monthId: string) => number | null;
  getSavingsTarget: (monthId: string) => number | null;
  clearProjection: (monthId: string) => void;
  clearAll: () => void;
  importProjections: (projections: Omit<MonthProjection, 'lastUpdated'>[]) => void;
  getProjectionsByDateRange: (startMonthId: string, endMonthId: string) => MonthProjection[];
};

const storage = getLocalforageStorage('projections');

export const useProjectionsStore = create<ProjectionsState>()(
  devtools(
    persist(
      (set, get) => ({
        projections: [],
        setProjection: (monthId, inflowTotal, savingsTarget) => {
          set((state) => {
            const existing = state.projections.find((p) => p.monthId === monthId);
            const updated: MonthProjection = {
              monthId,
              inflowTotal,
              savingsTarget,
              lastUpdated: new Date().toISOString(),
            };

            if (existing) {
              return {
                projections: state.projections.map((p) => (p.monthId === monthId ? updated : p)),
              };
            } else {
              return {
                projections: [...state.projections, updated],
              };
            }
          });
        },
        getProjection: (monthId) => {
          return get().projections.find((p) => p.monthId === monthId);
        },
        getInflowTotal: (monthId) => {
          const projection = get().projections.find((p) => p.monthId === monthId);
          return projection?.inflowTotal ?? null;
        },
        getSavingsTarget: (monthId) => {
          const projection = get().projections.find((p) => p.monthId === monthId);
          return projection?.savingsTarget ?? null;
        },
        clearProjection: (monthId) => {
          set((state) => ({
            projections: state.projections.filter((p) => p.monthId !== monthId),
          }));
        },
        clearAll: () => {
          set({ projections: [] });
        },
        importProjections: (projections) => {
          const now = new Date().toISOString();
          const projectionsWithTimestamp: MonthProjection[] = projections.map((p) => ({
            ...p,
            lastUpdated: now,
          }));

          set((state) => {
            // Merge with existing projections (new ones override existing)
            const existingMap = new Map(state.projections.map((p) => [p.monthId, p]));
            projectionsWithTimestamp.forEach((p) => {
              existingMap.set(p.monthId, p);
            });

            return {
              projections: Array.from(existingMap.values()),
            };
          });
        },
        getProjectionsByDateRange: (startMonthId, endMonthId) => {
          return get().projections.filter((p) => {
            return p.monthId >= startMonthId && p.monthId <= endMonthId;
          });
        },
      }),
      {
        name: 'projections',
        storage,
        version: 1,
      },
    ),
  ),
);

