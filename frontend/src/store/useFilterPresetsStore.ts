/**
 * Store for managing filter presets in Planner
 * Allows users to save and load filter configurations
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    selectedAccount: string | null;
    selectedBucket: string | null;
    selectedAccountType: string | null;
    selectedStatus: string | null;
    minAmount: number | null;
    maxAmount: number | null;
    showNegativeOnly: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

type FilterPresetsState = {
  presets: FilterPreset[];
  /**
   * Add a new filter preset
   */
  addPreset: (name: string, filters: FilterPreset['filters']) => string;
  /**
   * Update an existing preset
   */
  updatePreset: (id: string, name: string, filters: FilterPreset['filters']) => void;
  /**
   * Delete a preset
   */
  deletePreset: (id: string) => void;
  /**
   * Get a preset by ID
   */
  getPreset: (id: string) => FilterPreset | undefined;
  /**
   * Clear all presets
   */
  clearAll: () => void;
};

const storage = getLocalforageStorage('filter-presets');

export const useFilterPresetsStore = create<FilterPresetsState>()(
  devtools(
    persist(
      (set, get) => ({
        presets: [],
        addPreset: (name, filters) => {
          const id = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date().toISOString();
          const newPreset: FilterPreset = {
            id,
            name,
            filters,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            presets: [...state.presets, newPreset],
          }));
          return id;
        },
        updatePreset: (id, name, filters) => {
          set((state) => ({
            presets: state.presets.map((preset) =>
              preset.id === id
                ? { ...preset, name, filters, updatedAt: new Date().toISOString() }
                : preset,
            ),
          }));
        },
        deletePreset: (id) => {
          set((state) => ({
            presets: state.presets.filter((preset) => preset.id !== id),
          }));
        },
        getPreset: (id) => {
          return get().presets.find((preset) => preset.id === id);
        },
        clearAll: () => {
          set({ presets: [] });
        },
      }),
      {
        name: 'filter-presets',
        storage,
        version: 1,
      },
    ),
  ),
);

