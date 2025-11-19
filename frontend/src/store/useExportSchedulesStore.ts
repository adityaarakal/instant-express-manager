import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export type ExportScheduleFrequency = 'daily' | 'weekly' | 'monthly';
export type ExportScheduleType = 'income' | 'expense' | 'savings' | 'transfers' | 'all';

export interface ExportSchedule {
  id: string;
  name: string;
  type: ExportScheduleType;
  frequency: ExportScheduleFrequency;
  enabled: boolean;
  time: string; // HH:mm format (24-hour)
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  lastRun?: string; // ISO timestamp
  nextRun: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

type ExportSchedulesState = {
  schedules: ExportSchedule[];
  addSchedule: (schedule: Omit<ExportSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextRun' | 'lastRun'>) => string;
  updateSchedule: (id: string, updates: Partial<ExportSchedule>) => void;
  deleteSchedule: (id: string) => void;
  getSchedule: (id: string) => ExportSchedule | undefined;
  getEnabledSchedules: () => ExportSchedule[];
  updateLastRun: (id: string, nextRun: string) => void;
};

const storage = getLocalforageStorage('export-schedules');

/**
 * Calculate next run time based on frequency and schedule
 */
function calculateNextRun(schedule: Omit<ExportSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextRun' | 'lastRun'>): string {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  const nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case 'daily': {
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    }
    
    case 'weekly': {
      // Schedule for the specified day of week
      const targetDay = schedule.dayOfWeek ?? 0;
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
        daysUntilTarget += 7; // Next week
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;
    }
    
    case 'monthly': {
      // Schedule for the specified day of month
      const targetDayOfMonth = schedule.dayOfMonth ?? 1;
      
      // Set to target day of current month
      nextRun.setDate(targetDayOfMonth);
      
      // If day has passed this month, or if it's today but time has passed, schedule for next month
      if (nextRun < now || (nextRun.getDate() === now.getDate() && nextRun <= now)) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        // Handle months with fewer days (e.g., Feb 31 -> Feb 28/29)
        const daysInMonth = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
        nextRun.setDate(Math.min(targetDayOfMonth, daysInMonth));
      }
      break;
    }
  }

  return nextRun.toISOString();
}

export const useExportSchedulesStore = create<ExportSchedulesState>()(
  devtools(
    persist(
      (set, get) => ({
        schedules: [],
        addSchedule: (schedule) => {
          const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `schedule_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          
          const nextRun = calculateNextRun(schedule);
          const now = new Date().toISOString();
          
          const newSchedule: ExportSchedule = {
            ...schedule,
            id,
            nextRun,
            createdAt: now,
            updatedAt: now,
          };
          
          set((state) => ({
            schedules: [...state.schedules, newSchedule],
          }));
          
          return id;
        },
        updateSchedule: (id, updates) => {
          set((state) => {
            const schedule = state.schedules.find((s) => s.id === id);
            if (!schedule) return state;
            
            const updatedSchedule = { ...schedule, ...updates, updatedAt: new Date().toISOString() };
            
            // Recalculate nextRun if frequency, time, or related fields changed
            if (updates.frequency || updates.time || updates.dayOfWeek !== undefined || updates.dayOfMonth !== undefined) {
              updatedSchedule.nextRun = calculateNextRun(updatedSchedule);
            }
            
            return {
              schedules: state.schedules.map((s) => (s.id === id ? updatedSchedule : s)),
            };
          });
        },
        deleteSchedule: (id) => {
          set((state) => ({
            schedules: state.schedules.filter((s) => s.id !== id),
          }));
        },
        getSchedule: (id) => {
          return get().schedules.find((s) => s.id === id);
        },
        getEnabledSchedules: () => {
          return get().schedules.filter((s) => s.enabled);
        },
        updateLastRun: (id, nextRun) => {
          set((state) => ({
            schedules: state.schedules.map((s) => {
              if (s.id === id) {
                return {
                  ...s,
                  lastRun: new Date().toISOString(),
                  nextRun,
                };
              }
              return s;
            }),
          }));
        },
      }),
      {
        name: 'export-schedules',
        storage,
        version: 1,
      },
    ),
  ),
);

